"""Dependencias comunes: sesión de BD, usuario autenticado y control por roles."""

from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db import get_db
from app.models import Usuario

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    no_auth = HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado", {"WWW-Authenticate": "Bearer"})
    if cred is None:
        raise no_auth
    try:
        payload = decode_token(cred.credentials)
        user = db.get(Usuario, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise no_auth from None
    if user is None or not user.activo:
        raise no_auth
    return user


def require_roles(*roles: str) -> Callable[..., Usuario]:
    def _check(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.rol not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permisos para esta acción")
        return user

    return _check


gestion = require_roles("ADMIN", "PLANIFICADOR")
solo_admin = require_roles("ADMIN")
