"""RF-001 flota · RF-002 pedidos · RF-008 conductores · RF-009 clientes."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import gestion, get_current_user
from app.api.paginacion import Pagina, paginar, params_pagina
from app.api.routers.crud import crud_router
from app.db import get_db
from app.models import Cliente, Conductor, Pedido, Vehiculo
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


vehiculos = crud_router(
    model=Vehiculo, entrada=VehiculoIn, cambio=VehiculoUpdate, salida=VehiculoOut, prefix="/vehiculos", tag="Flota",
    duplicado="La placa ya está registrada",
)
conductores = crud_router(
    model=Conductor, entrada=ConductorIn, cambio=ConductorUpdate, salida=ConductorOut,
    prefix="/conductores", tag="Conductores", validar=_validar_conductor, duplicado="El DNI ya está registrado",
)
clientes = crud_router(
    model=Cliente, entrada=ClienteIn, cambio=ClienteUpdate, salida=ClienteOut, prefix="/clientes", tag="Clientes",
)

# ---------------- Pedidos ----------------
pedidos = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _pedido(db: Session, pedido_id: int) -> Pedido:
    p = db.get(Pedido, pedido_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no existe")
    return p


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
    db.commit()
    return p


@pedidos.delete("/{pedido_id}", status_code=204)
def cancelar_pedido(pedido_id: int, db: Session = Depends(get_db), _=Depends(gestion)):
    _pedido(db, pedido_id).estado = "CANCELADO"
    db.commit()
    return Response(status_code=204)
