import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core import cache  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Usuario  # noqa: E402

settings.SOLVER_TIME_LIMIT_S = 1
USUARIOS = [("admin@test.pe", "ADMIN"), ("plan@test.pe", "PLANIFICADOR"), ("cond@test.pe", "CONDUCTOR"),
            ("audi@test.pe", "AUDITOR")]
_HASH = hash_password("Secreta123")


@pytest.fixture(autouse=True)
def dia_de_operacion(monkeypatch):
    """Las pruebas planifican el lunes 16/11/2026: las rutas "de hoy" son las de ese día."""
    from datetime import date  # noqa: PLC0415

    monkeypatch.setattr("app.api.routers.rutas.hoy", lambda: date(2026, 11, 16))


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    yield session
    session.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    cache.limpiar()
    for correo, rol in USUARIOS:
        db.add(Usuario(correo=correo, nombre=rol.title(), rol=rol, password_hash=_HASH))
    db.commit()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def token(client: TestClient, correo: str = "admin@test.pe") -> dict:
    r = client.post("/api/auth/login", json={"correo": correo, "password": "Secreta123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def admin(client):
    return token(client)
