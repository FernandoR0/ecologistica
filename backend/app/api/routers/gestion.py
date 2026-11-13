"""RF-001 flota · RF-002 pedidos · RF-008 conductores · RF-009 preferencias."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import gestion, get_current_user
from app.api.routers.crud import crud_router
from app.db import get_db
from app.models import Conductor, Pedido, PreferenciaCliente, Vehiculo
from app.schemas import (
    ConductorIn,
    ConductorOut,
    ConductorUpdate,
    PedidoIn,
    PedidoOut,
    PedidoUpdate,
    PreferenciaIn,
    PreferenciaOut,
    VehiculoIn,
    VehiculoOut,
    VehiculoUpdate,
)

vehiculos = crud_router(
    model=Vehiculo, entrada=VehiculoIn, cambio=VehiculoUpdate, salida=VehiculoOut, prefix="/vehiculos", tag="Flota"
)
conductores = crud_router(
    model=Conductor, entrada=ConductorIn, cambio=ConductorUpdate, salida=ConductorOut,
    prefix="/conductores", tag="Conductores",
)

# ---------------- Pedidos ----------------
pedidos = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _pedido(db: Session, pedido_id: int) -> Pedido:
    p = db.get(Pedido, pedido_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no existe")
    return p


@pedidos.get("", response_model=list[PedidoOut])
def listar_pedidos(estado: str | None = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = select(Pedido).order_by(Pedido.id)
    if estado:
        q = q.where(Pedido.estado == estado.upper())
    return db.scalars(q).all()


@pedidos.get("/{pedido_id}", response_model=PedidoOut)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _pedido(db, pedido_id)


@pedidos.post("", response_model=PedidoOut, status_code=201)
def crear_pedido(datos: PedidoIn, db: Session = Depends(get_db), _=Depends(gestion)):
    p = Pedido(**datos.model_dump())
    db.add(p)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Código de pedido duplicado") from None
    return p


@pedidos.put("/{pedido_id}", response_model=PedidoOut)
def actualizar_pedido(pedido_id: int, datos: PedidoUpdate, db: Session = Depends(get_db), _=Depends(gestion)):
    p = _pedido(db, pedido_id)
    if p.estado == "PLANIFICADO" and datos.model_dump(exclude_unset=True, exclude={"estado"}):
        raise HTTPException(status.HTTP_409_CONFLICT, "El pedido ya está en una ruta; re-optimice la ruta")
    for k, v in datos.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    return p


@pedidos.delete("/{pedido_id}", status_code=204)
def cancelar_pedido(pedido_id: int, db: Session = Depends(get_db), _=Depends(gestion)):
    _pedido(db, pedido_id).estado = "CANCELADO"
    db.commit()
    return Response(status_code=204)


# ---------------- Preferencias de clientes ----------------
preferencias = APIRouter(prefix="/preferencias", tags=["Preferencias de clientes"])


@preferencias.get("", response_model=list[PreferenciaOut])
def listar_preferencias(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.scalars(select(PreferenciaCliente).order_by(PreferenciaCliente.cliente)).all()


@preferencias.put("/{cliente}", response_model=PreferenciaOut)
def guardar_preferencia(cliente: str, datos: PreferenciaIn, db: Session = Depends(get_db), _=Depends(gestion)):
    pref = db.scalar(select(PreferenciaCliente).where(PreferenciaCliente.cliente == cliente))
    if pref is None:
        pref = PreferenciaCliente(cliente=cliente)
        db.add(pref)
    for k, v in datos.model_dump().items():
        setattr(pref, k, v)
    db.commit()
    return pref


@preferencias.delete("/{cliente}", status_code=204)
def borrar_preferencia(cliente: str, db: Session = Depends(get_db), _=Depends(gestion)):
    pref = db.scalar(select(PreferenciaCliente).where(PreferenciaCliente.cliente == cliente))
    if pref is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sin preferencia registrada")
    db.delete(pref)
    db.commit()
    return Response(status_code=204)
