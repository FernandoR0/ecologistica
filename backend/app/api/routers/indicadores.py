"""RF-005 · RF-006 · RF-010."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, solo_admin
from app.db import get_db
from app.models import Compensacion
from app.schemas import CompensacionIn, CompensacionOut
from app.services import indicadores

router = APIRouter(tags=["Indicadores y sostenibilidad"])


@router.get("/indicadores")
def dashboard(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
              _=Depends(get_current_user)):
    return indicadores.dashboard(db, desde, hasta)


@router.get("/indicadores/sostenibilidad")
def sostenibilidad(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
                   _=Depends(get_current_user)):
    return indicadores.sostenibilidad(db, desde, hasta)


@router.get("/compensacion/plan")
def plan(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db),
         _=Depends(get_current_user)):
    return indicadores.plan_compensacion(db, desde, hasta)


@router.get("/compensacion", response_model=list[CompensacionOut])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.scalars(select(Compensacion).order_by(Compensacion.fecha.desc())).all()


@router.post("/compensacion", response_model=CompensacionOut, status_code=201)
def registrar(datos: CompensacionIn, db: Session = Depends(get_db), _=Depends(solo_admin)):
    c = Compensacion(**datos.model_dump())
    db.add(c)
    db.commit()
    return c
