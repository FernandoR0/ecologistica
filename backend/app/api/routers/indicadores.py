"""RF-005 · RF-006 · RF-010."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import gestion, get_current_user
from app.core import cache
from app.db import get_db
from app.models import Compensacion
from app.schemas import CompensacionIn, CompensacionOut
from app.services import indicadores, reporte_pdf

router = APIRouter(tags=["Indicadores y sostenibilidad"])


def _validar_rango(desde: date | None, hasta: date | None) -> None:
    if desde and hasta and desde > hasta:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Rango de fechas inválido")


@router.get("/indicadores")
def dashboard(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
              _=Depends(get_current_user)):
    return cache.obtener(("dashboard", desde, hasta), lambda: indicadores.dashboard(db, desde, hasta))


@router.get("/indicadores/sostenibilidad")
def sostenibilidad(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
                   _=Depends(get_current_user)):
    return cache.obtener(("sostenibilidad", desde, hasta), lambda: indicadores.sostenibilidad(db, desde, hasta))


@router.get("/indicadores/reporte.pdf", response_class=Response)
def reporte(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
            _=Depends(get_current_user)):
    """RF-006 · Reporte PDF descargable del periodo."""
    _validar_rango(desde, hasta)
    nombre = f"reporte-sostenibilidad-{desde or 'inicio'}-{hasta or 'hoy'}.pdf"
    return Response(reporte_pdf.generar(db, desde, hasta), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{nombre}"'})


@router.get("/indicadores/costo-ciclo-vida")
def costo_ciclo_vida(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
                     _=Depends(get_current_user)):
    _validar_rango(desde, hasta)
    return cache.obtener(("lcc", desde, hasta), lambda: indicadores.costo_ciclo_vida(db, desde, hasta))


@router.get("/compensacion/plan")
def plan(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
         _=Depends(get_current_user)):
    return cache.obtener(("plan", desde, hasta), lambda: indicadores.plan_compensacion(db, desde, hasta))


@router.get("/compensacion", response_model=list[CompensacionOut])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.scalars(select(Compensacion).order_by(Compensacion.fecha.desc())).all()


@router.post("/compensacion", response_model=CompensacionOut, status_code=201)
def registrar(datos: CompensacionIn, db: Session = Depends(get_db), user=Depends(gestion)):
    c = Compensacion(**datos.model_dump(), usuario_id=user.id)
    db.add(c)
    db.commit()
    return c
