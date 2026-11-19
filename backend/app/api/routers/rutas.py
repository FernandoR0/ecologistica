"""RF-003 rutas optimizadas · RF-004 datos para el mapa · RF-007 re-optimización."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import gestion, get_current_user
from app.api.paginacion import Pagina, paginar, params_pagina
from app.db import get_db
from app.models import Conductor, Incidente, Parada, Ruta, Usuario
from app.schemas import (
    EstadoRutaIn,
    IncidenteIn,
    IncidenteOut,
    OptimizarIn,
    ParadaOut,
    ResultadoPlanOut,
    RutaOut,
)
from app.services import planificacion

router = APIRouter(prefix="/rutas", tags=["Rutas"])


def _respuesta(res: planificacion.Resultado) -> ResultadoPlanOut:
    km = sum(r.distancia_km for r in res.rutas)
    co2 = sum(r.co2_kg for r in res.rutas)
    return ResultadoPlanOut(
        estado=res.estado,
        rutas=[RutaOut.model_validate(r) for r in res.rutas],
        no_asignados=res.no_asignados,
        distancia_total_km=round(km, 3),
        co2_total_kg=round(co2, 3),
        ahorro_km=round(sum(r.distancia_base_km for r in res.rutas) - km, 3),
        ahorro_co2_kg=round(sum(r.co2_base_kg for r in res.rutas) - co2, 3),
        tiempo_calculo_ms=res.tiempo_calculo_ms,
    )


@router.post("/optimizar", response_model=ResultadoPlanOut)
def optimizar(datos: OptimizarIn, db: Session = Depends(get_db), _=Depends(gestion)):
    try:
        res = planificacion.planificar(db, datos.fecha or date.today(), datos.pedido_ids, datos.limite_segundos)
    except planificacion.PlanificacionError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    return _respuesta(res)


def _con_relaciones(q):
    # Carga paradas, pedidos, vehiculo y conductor en pocas consultas (evita el problema N+1)
    return q.options(
        selectinload(Ruta.paradas).selectinload(Parada.pedido),
        selectinload(Ruta.vehiculo),
        selectinload(Ruta.conductor),
    )


@router.get("", response_model=list[RutaOut])
def listar(
    response: Response,
    fecha: date | None = None,
    estado: str | None = Query(None, description="Uno o varios separados por coma: PLANIFICADA,EN_CURSO"),
    p: Pagina = Depends(params_pagina),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Ruta).order_by(Ruta.id.desc())
    if fecha:
        q = q.where(Ruta.fecha == fecha)
    if estado:
        q = q.where(Ruta.estado.in_([e.strip().upper() for e in estado.split(",")]))
    return paginar(db, _con_relaciones(q), p, response)


@router.get("/mias", response_model=list[RutaOut])
def mis_rutas(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    """Rutas del conductor autenticado (vista móvil del conductor)."""
    conductor = db.scalar(select(Conductor).where(Conductor.usuario_id == user.id))
    if conductor is None:
        return []
    return db.scalars(
        _con_relaciones(
            select(Ruta).where(Ruta.conductor_id == conductor.id, Ruta.estado.in_(("PLANIFICADA", "EN_CURSO")))
        )
    ).all()


@router.get("/{ruta_id}", response_model=RutaOut)
def obtener(ruta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ruta = db.get(Ruta, ruta_id)
    if ruta is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ruta no existe")
    return ruta


@router.patch("/{ruta_id}/estado", response_model=RutaOut)
def cambiar_estado(ruta_id: int, datos: EstadoRutaIn, db: Session = Depends(get_db), _=Depends(gestion)):
    ruta = obtener(ruta_id, db)
    ruta.estado = datos.estado
    if datos.estado == "COMPLETADA":
        for p in ruta.paradas:
            p.estado = "ENTREGADA"
            p.pedido.estado = "ENTREGADO"
    db.commit()
    return ruta


@router.post("/{ruta_id}/reoptimizar", response_model=ResultadoPlanOut)
def reoptimizar(ruta_id: int, inc: IncidenteIn, db: Session = Depends(get_db), user: Usuario = Depends(gestion)):
    try:
        res = planificacion.reoptimizar(
            db, ruta_id, inc.tipo, inc.hora_actual, inc.demora_min, inc.paradas_completadas,
            pedido_id=inc.pedido_id, descripcion=inc.descripcion, usuario_id=user.id,
        )
    except planificacion.PlanificacionError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    return _respuesta(res)


@router.get("/{ruta_id}/incidentes", response_model=list[IncidenteOut])
def incidentes(ruta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Incidentes registrados sobre la ruta (trazabilidad de la re-optimización)."""
    return db.scalars(select(Incidente).where(Incidente.ruta_id == ruta_id).order_by(Incidente.id)).all()


@router.patch("/{ruta_id}/paradas/{parada_id}/entregada", response_model=ParadaOut)
def marcar_entregada(ruta_id: int, parada_id: int, db: Session = Depends(get_db),
                     user: Usuario = Depends(get_current_user)):
    """US-014 · El conductor (solo en su ruta) o el planificador marca una entrega como realizada."""
    parada = db.get(Parada, parada_id)
    if parada is None or parada.ruta_id != ruta_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Parada no existe en esta ruta")
    if user.rol == "AUDITOR":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permisos para esta acción")
    if user.rol == "CONDUCTOR":
        conductor = db.scalar(select(Conductor).where(Conductor.usuario_id == user.id))
        if conductor is None or parada.ruta.conductor_id != conductor.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo puede marcar entregas de su propia ruta")
    parada.estado = "ENTREGADA"
    parada.pedido.estado = "ENTREGADO"
    ruta = parada.ruta
    if ruta.estado == "PLANIFICADA":
        ruta.estado = "EN_CURSO"
    if all(p.estado == "ENTREGADA" for p in ruta.paradas):
        ruta.estado = "COMPLETADA"
    db.commit()
    return parada
