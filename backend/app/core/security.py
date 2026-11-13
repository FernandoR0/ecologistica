"""Hash de contraseñas (bcrypt), tokens JWT y bloqueo por intentos fallidos."""

import time
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

ALGORITMO = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def create_token(user_id: int, rol: str) -> str:
    ahora = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "rol": rol,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITMO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITMO])


class BloqueoLogin:
    """Bloquea temporalmente un correo tras N intentos fallidos (OWASP A07)."""

    def __init__(self) -> None:
        self._fallos: dict[str, list[float]] = {}

    def _vigentes(self, correo: str) -> list[float]:
        limite = time.monotonic() - settings.BLOQUEO_LOGIN_MIN * 60
        fallos = [t for t in self._fallos.get(correo, []) if t > limite]
        self._fallos[correo] = fallos
        return fallos

    def bloqueado(self, correo: str) -> bool:
        return len(self._vigentes(correo)) >= settings.MAX_INTENTOS_LOGIN

    def registrar_fallo(self, correo: str) -> None:
        self._vigentes(correo).append(time.monotonic())

    def limpiar(self, correo: str | None = None) -> None:
        if correo is None:
            self._fallos.clear()
        else:
            self._fallos.pop(correo, None)


bloqueo_login = BloqueoLogin()
