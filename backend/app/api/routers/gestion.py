"""RF-001 flota · RF-002 pedidos · RF-008 conductores · RF-009 clientes."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import gestion, get_current_user
from app.api.paginacion import Pagina, paginar, params_pagina
from app.api.routers.crud import crud_router
from app.core.tiempo import hora_actual
from app.db import get_db
from app.models import Cliente, Conductor, Incidente, Parada, Pedido, Ruta, Usuario, Vehiculo
from app.schemas import (
    ClienteIn,
    ClienteOut,
    ClienteUpdate,
    ConductorIn,
    ConductorOut,
    ConductorUpdate,
    PedidoIn,
    PedidoOut,
    PedidoResumen,
    PedidoUpdate,
    VehiculoIn,
    VehiculoOut,
    VehiculoUpdate,
)
from app.services import planificacion

# RN-015: categoría mínima de licencia por tipo de vehículo
ORDEN_A = ("A-I", "A-IIa", "A-IIb", "A-IIIa", "A-IIIb", "A-IIIc")
LICENCIA_MINIMA = {"CAMIONETA": "A-I", "FURGON": "A-IIb"}
LICENCIAS_MOTO = ("B-IIb", "B-IIc")


def licencia_valida(categoria: str, tipo_vehiculo: str) -> bool:
    if tipo_vehiculo == "MOTO":
        return categoria in LICENCIAS_MOTO
    minima = LICENCIA_MINIMA.get(tipo_vehiculo, "A-I")
    return categoria in ORDEN_A and ORDEN_A.index(categoria) >= ORDEN_A.index(minima)


def _validar_conductor(db: Session, cond: Conductor) -> None:
    if cond.vehiculo_id is None:
        return
    veh = db.get(Vehiculo, cond.vehiculo_id)
    if veh is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El vehículo asignado no existe")
    if not licencia_valida(cond.categoria_licencia, veh.tipo):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"La licencia {cond.categoria_licencia} no es válida para un vehículo tipo {veh.tipo}",
        )


RUTA_VIGENTE = ("PLANIFICADA", "EN_CURSO")


def _ruta_vigente(db: Session, condicion) -> Ruta | None:
    """Primera ruta planificada o en curso que cumple la condición y aún tiene entregas pendientes."""
    return db.scalar(
        select(Ruta).join(Parada).where(condicion, Ruta.estado.in_(RUTA_VIGENTE), Parada.estado == "PENDIENTE")
        .order_by(Ruta.id).limit(1)
    )


def _antes_de_desactivar_vehiculo(db: Session, veh: Vehiculo) -> None:
    ruta = _ruta_vigente(db, Ruta.vehiculo_id == veh.id)
    if ruta:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"El vehículo {veh.placa} tiene entregas pendientes en la ruta #{ruta.id}. Registre una avería en Rutas "
            "para repartirlas entre otros vehículos antes de desactivarlo.",
        )


def _antes_de_desactivar_conductor(db: Session, cond: Conductor) -> None:
    ruta = _ruta_vigente(db, Ruta.conductor_id == cond.id)
    if ruta:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{cond.nombre} tiene entregas pendientes en la ruta #{ruta.id}. Registre una avería en Rutas para "
            "repartirlas entre otros vehículos antes de desactivarlo.",
        )


def _antes_de_desactivar_cliente(db: Session, cli: Cliente) -> None:
    activos = db.scalars(
        select(Pedido.id).where(Pedido.cliente_id == cli.id, Pedido.estado.in_(("PENDIENTE", "PLANIFICADO")))
    ).all()
    if activos:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{cli.nombre} tiene {len(activos)} pedido(s) pendiente(s) o en ruta. Cancélelos en Pedidos antes de "
            "desactivar el cliente.",
        )


vehiculos = crud_router(
    model=Vehiculo, entrada=VehiculoIn, cambio=VehiculoUpdate, salida=VehiculoOut, prefix="/vehiculos", tag="Flota",
    duplicado="La placa ya está registrada", antes_de_desactivar=_antes_de_desactivar_vehiculo,
)
conductores = crud_router(
    model=Conductor, entrada=ConductorIn, cambio=ConductorUpdate, salida=ConductorOut,
    prefix="/conductores", tag="Conductores", validar=_validar_conductor, duplicado="El DNI ya está registrado",
    antes_de_desactivar=_antes_de_desactivar_conductor,
)
clientes = crud_router(
    model=Cliente, entrada=ClienteIn, cambio=ClienteUpdate, salida=ClienteOut, prefix="/clientes", tag="Clientes",
    antes_de_desactivar=_antes_de_desactivar_cliente,
)

# ---------------- Pedidos ----------------
pedidos = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _pedido(db: Session, pedido_id: int) -> Pedido:
    p = db.get(Pedido, pedido_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no existe")
    return p


def _validar_capacidad(db: Session, peso_kg: float, volumen_m3: float) -> None:
    """Un pedido que no cabe en ningún vehículo activo se rechaza al registrarlo, no recién al generar rutas
    (cuello de botella de la prueba de usabilidad SUS). Sin flota registrada no hay contra qué comparar."""
    kg, m3 = db.execute(
        select(func.max(Vehiculo.capacidad_kg), func.max(Vehiculo.volumen_m3)).where(Vehiculo.activo.is_(True))
    ).one()
    if kg is not None and peso_kg > kg:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"Ningún vehículo de la flota puede llevar {peso_kg:g} kg: el de mayor capacidad carga {kg:g} kg",
        )
    if m3 is not None and volumen_m3 > m3:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"Ningún vehículo de la flota puede llevar {volumen_m3:g} m³: el de mayor volumen lleva {m3:g} m³",
        )


def _codigo_libre(db: Session, pedido_id: int) -> str:
    """PED-0001, PED-0002…; si alguien ya usó ese código a mano, agrega un sufijo."""
    base = f"PED-{pedido_id:04d}"
    codigo, n = base, 1
    while db.scalar(select(Pedido.id).where(Pedido.codigo == codigo, Pedido.id != pedido_id)) is not None:
        n += 1
        codigo = f"{base}-{n}"
    return codigo


@pedidos.get("", response_model=list[PedidoResumen])
def listar_pedidos(
    response: Response,
    estado: str | None = None,
    p: Pagina = Depends(params_pagina),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Pedido).order_by(Pedido.id.desc())
    if estado:
        q = q.where(Pedido.estado == estado.upper())
    return paginar(db, q, p, response)


@pedidos.get("/{pedido_id}", response_model=PedidoOut)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _pedido(db, pedido_id)


@pedidos.post("", response_model=PedidoOut, status_code=201)
def crear_pedido(datos: PedidoIn, db: Session = Depends(get_db), _=Depends(gestion)):
    cliente = db.get(Cliente, datos.cliente_id)
    if cliente is None or not cliente.activo:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El cliente no existe o está inactivo")
    valores = datos.model_dump()
    # Si no se indican, se usan la dirección, la ubicación y el horario preferido del cliente (RN-007)
    for campo, por_defecto in (
        ("direccion", cliente.direccion), ("punto_referencia", cliente.punto_referencia),
        ("lat", cliente.lat), ("lng", cliente.lng),
        ("ventana_inicio", cliente.hora_desde), ("ventana_fin", cliente.hora_hasta),
    ):
        if valores[campo] is None:
            valores[campo] = por_defecto
    if valores["ventana_inicio"] >= valores["ventana_fin"]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "La ventana debe terminar después de empezar")
    _validar_capacidad(db, valores["peso_kg"], valores["volumen_m3"])
    automatico = valores["codigo"] is None
    if automatico:
        # Código provisional único; se reemplaza por PED-<id> en cuanto la base asigna el id
        valores["codigo"] = f"TMP-{uuid4().hex[:16]}"
    p = Pedido(**valores)
    db.add(p)
    try:
        db.flush()
        if automatico:
            p.codigo = _codigo_libre(db, p.id)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Código de pedido duplicado") from None
    db.refresh(p)
    return p


@pedidos.put("/{pedido_id}", response_model=PedidoOut)
def actualizar_pedido(pedido_id: int, datos: PedidoUpdate, db: Session = Depends(get_db), _=Depends(gestion)):
    p = _pedido(db, pedido_id)
    if p.estado == "PLANIFICADO" and datos.model_dump(exclude_unset=True, exclude={"estado"}):
        raise HTTPException(status.HTTP_409_CONFLICT, "El pedido ya está en una ruta; re-optimice la ruta")
    for k, v in datos.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    if p.ventana_inicio >= p.ventana_fin:
        db.rollback()
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "La ventana debe terminar después de empezar")
    try:
        _validar_capacidad(db, p.peso_kg, p.volumen_m3)
    except HTTPException:
        db.rollback()
        raise
    db.commit()
    return p


@pedidos.delete("/{pedido_id}", status_code=204)
def cancelar_pedido(pedido_id: int, db: Session = Depends(get_db), user: Usuario = Depends(gestion)):
    """Cancela el pedido. Si ya está en una ruta vigente, la ruta se re-optimiza sin él (RF-007, incidente
    CANCELACION), igual que al registrar la cancelación desde la pantalla Rutas."""
    p = _pedido(db, pedido_id)
    if p.estado == "ENTREGADO":
        raise HTTPException(status.HTTP_409_CONFLICT, "El pedido ya fue entregado; no se puede cancelar")
    parada = db.scalar(
        select(Parada).join(Ruta).where(
            Parada.pedido_id == p.id, Parada.estado == "PENDIENTE", Ruta.estado.in_(RUTA_VIGENTE),
        )
    )
    if parada is not None:
        ruta_id, parada_id, hora = parada.ruta_id, parada.id, hora_actual()
        descripcion = "Pedido cancelado desde la pantalla Pedidos"
        try:
            planificacion.reoptimizar(
                db, ruta_id, "CANCELACION", hora_actual=hora, pedido_id=p.id, descripcion=descripcion,
                usuario_id=user.id,
            )
        except planificacion.PlanificacionError:
            # Sin jornada restante para recalcular: se quita la parada y las demás conservan su orden
            db.rollback()
            ruta = db.get(Ruta, ruta_id)
            ruta.paradas.remove(db.get(Parada, parada_id))
            db.add(Incidente(ruta_id=ruta_id, tipo="CANCELACION", hora=hora, pedido_id=p.id,
                             descripcion=descripcion, usuario_id=user.id))
            if not any(x.estado == "PENDIENTE" for x in ruta.paradas):
                ruta.estado = "COMPLETADA"
    p = _pedido(db, pedido_id)
    p.estado = "CANCELADO"
    db.commit()
    return Response(status_code=204)
