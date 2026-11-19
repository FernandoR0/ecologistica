from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, solo_admin
from app.core.security import (
    bloqueado,
    create_token,
    hash_password,
    limpiar_fallos,
    registrar_fallo,
    verify_password,
)
from app.db import get_db
from app.models import Usuario
from app.schemas import LoginIn, TokenOut, UsuarioIn, UsuarioOut

router = APIRouter(prefix="/auth", tags=["Autenticación"])
MENSAJE_BLOQUEO = "Cuenta bloqueada 15 minutos por intentos fallidos"


@router.post("/login", response_model=TokenOut)
def login(datos: LoginIn, request: Request, db: Session = Depends(get_db)):
    correo = datos.correo.lower()
    request.state.correo_login = correo
    user = db.scalar(select(Usuario).where(Usuario.correo == correo))
    if user is not None and bloqueado(user):
        raise HTTPException(status.HTTP_423_LOCKED, MENSAJE_BLOQUEO)
    if user is None or not user.activo or not verify_password(datos.password, user.password_hash):
        if user is not None:
            registrar_fallo(user)
            db.commit()
            if bloqueado(user):
                raise HTTPException(status.HTTP_423_LOCKED, MENSAJE_BLOQUEO)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
    limpiar_fallos(user)
    db.commit()
    return TokenOut(access_token=create_token(user.id, user.rol, user.correo), usuario=UsuarioOut.model_validate(user))


@router.get("/me", response_model=UsuarioOut)
def me(user: Usuario = Depends(get_current_user)):
    return user


@router.post("/usuarios", response_model=UsuarioOut, status_code=201)
def crear_usuario(datos: UsuarioIn, db: Session = Depends(get_db), _: Usuario = Depends(solo_admin)):
    user = Usuario(
        correo=datos.correo.lower(), nombre=datos.nombre, rol=datos.rol, password_hash=hash_password(datos.password)
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado") from None
    return user


@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), _: Usuario = Depends(require_roles("ADMIN", "AUDITOR"))):
    return db.scalars(select(Usuario).order_by(Usuario.id)).all()
