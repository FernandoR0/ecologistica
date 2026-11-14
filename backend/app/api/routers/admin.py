"""RF-012 · Configuración del motor, bitácora de auditoría y gestión de usuarios (solo ADMIN)."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import solo_admin
from app.api.paginacion import Pagina, paginar, params_pagina
from app.db import get_db
from app.models import Auditoria, Usuario
from app.schemas import AuditoriaOut, ConfiguracionIn, ConfiguracionOut, UsuarioOut, UsuarioUpdate
from app.services.planificacion import obtener_configuracion

router = APIRouter(tags=["Administración"])


@router.get("/configuracion", response_model=ConfiguracionOut)
def ver_configuracion(db: Session = Depends(get_db), _=Depends(solo_admin)):
    return obtener_configuracion(db)


@router.put("/configuracion", response_model=ConfiguracionOut)
def guardar_configuracion(datos: ConfiguracionIn, db: Session = Depends(get_db), _=Depends(solo_admin)):
    conf = obtener_configuracion(db)
    for k, v in datos.model_dump().items():
        setattr(conf, k, v)
    db.commit()
    return conf


@router.get("/auditoria", response_model=list[AuditoriaOut])
def ver_auditoria(
    response: Response,
    correo: str | None = None,
    p: Pagina = Depends(params_pagina),
    db: Session = Depends(get_db),
    _=Depends(solo_admin),
):
    q = select(Auditoria).order_by(Auditoria.id.desc())
    if correo:
        q = q.where(Auditoria.correo == correo.lower())
    return paginar(db, q, p, response)


@router.put("/auth/usuarios/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: Session = Depends(get_db),
                       admin: Usuario = Depends(solo_admin)):
    user = db.get(Usuario, usuario_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no existe")
    if user.id == admin.id and (datos.activo is False or (datos.rol and datos.rol != "ADMIN")):
        raise HTTPException(status.HTTP_409_CONFLICT, "No puede desactivarse ni quitarse el rol de administrador")
    for k, v in datos.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    return user
