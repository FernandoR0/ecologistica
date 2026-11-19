"""ENB-007 · Encuesta de usabilidad SUS dentro de la aplicación."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db import get_db
from app.models import RespuestaSus
from app.schemas import RespuestaSusIn, RespuestaSusOut
from app.services import sus

router = APIRouter(prefix="/sus", tags=["Encuesta de usabilidad (SUS)"])


@router.get("/preguntas")
def preguntas(_=Depends(get_current_user)):
    return {"escala": "1 = Totalmente en desacuerdo · 5 = Totalmente de acuerdo", "preguntas": sus.PREGUNTAS}


@router.post("", response_model=RespuestaSusOut, status_code=201)
def responder(datos: RespuestaSusIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    respuesta = RespuestaSus(**datos.model_dump())
    db.add(respuesta)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese código de participante ya respondió la encuesta") from None
    db.refresh(respuesta)
    return respuesta


@router.get("/resultados")
def resultados(db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "AUDITOR"))):
    filas = list(db.scalars(select(RespuestaSus).order_by(RespuestaSus.id)))
    return {
        **sus.resumen([f.respuestas for f in filas]),
        "respuestas": [RespuestaSusOut.model_validate(f).model_dump() for f in filas],
    }
