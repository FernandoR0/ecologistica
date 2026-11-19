"""Hash de contraseñas (bcrypt, costo 12), tokens JWT y bloqueo por intentos fallidos (RN-001)."""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

ALGORITMO = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def create_token(user_id: int, rol: str, correo: str | None = None) -> str:
    ahora = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "rol": rol,
        "correo": correo,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITMO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITMO])


def bloqueado(usuario, ahora: datetime | None = None) -> bool:
    """RN-001: la cuenta está bloqueada mientras `bloqueado_hasta` sea futuro."""
    ahora = ahora or datetime.now(UTC).replace(tzinfo=None)
    return usuario.bloqueado_hasta is not None and usuario.bloqueado_hasta > ahora


def registrar_fallo(usuario) -> None:
    """Suma un intento fallido; al llegar al máximo bloquea la cuenta `BLOQUEO_LOGIN_MIN` minutos."""
    usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1
    if usuario.intentos_fallidos >= settings.MAX_INTENTOS_LOGIN:
        usuario.bloqueado_hasta = datetime.now(UTC).replace(tzinfo=None) + timedelta(
            minutes=settings.BLOQUEO_LOGIN_MIN
        )
        usuario.intentos_fallidos = 0


def limpiar_fallos(usuario) -> None:
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
