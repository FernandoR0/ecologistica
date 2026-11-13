"""RF-003 rutas optimizadas · RF-004 datos para el mapa · RF-007 re-optimización."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import gestion, get_current_user
from app.db import get_db
from app.models import Conductor, Ruta, Usuario
from app.schemas import EstadoRutaIn, IncidenteIn, OptimizarIn, ResultadoPlanOut, RutaOut
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


@router.get("", response_model=list[RutaOut])
def listar(fecha: date | None = None, estado: str | None = None, db: Session = Depends(get_db),
           _=Depends(get_current_user)):
    q = select(Ruta).order_by(Ruta.id.desc())
    if fecha:
        q = q.where(Ruta.fecha == fecha)
    if estado:
        q = q.where(Ruta.estado == estado.upper())
    return db.scalars(q).all()


@router.get("/mias", response_model=list[RutaOut])
def mis_rutas(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    """Rutas del conductor autenticado (vista móvil del conductor)."""
    conductor = db.scalar(select(Conductor).where(Conductor.usuario_id == user.id))
    if conductor is None:
        return []
    return db.scalars(
        select(Ruta).where(Ruta.conductor_id == conductor.id, Ruta.estado.in_(("PLANIFICADA", "EN_CURSO")))
    ).all()


@router.get("/{ruta_id}", response_model=RutaOut)
def obtener(ruta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ruta = db.get(Ruta, ruta_id)
    if ruta is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ruta no existe")
    return ruta


@router.patch("/{ruta_id}/estado", response_model=RutaOut)
def cambiar_estado(ruta_id: int, datos: EstadoRutaIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ruta = obtener(ruta_id, db)
    ruta.estado = datos.estado
    if datos.estado == "COMPLETADA":
        for p in ruta.paradas:
            p.estado = "ENTREGADA"
            p.pedido.estado = "ENTREGADO"
    db.commit()
    return ruta


@router.post("/{ruta_id}/reoptimizar", response_model=ResultadoPlanOut)
def reoptimizar(ruta_id: int, inc: IncidenteIn, db: Session = Depends(get_db), _=Depends(gestion)):
    try:
        res = planificacion.reoptimizar(
            db, ruta_id, inc.tipo, inc.hora_actual, inc.demora_min, inc.paradas_completadas
        )
    except planificacion.PlanificacionError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    return _respuesta(res)
