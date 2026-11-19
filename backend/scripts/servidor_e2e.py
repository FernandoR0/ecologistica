"""Levanta la API real para las pruebas E2E de Playwright sobre una base aislada.

Uso (desde backend/):  python -m scripts.servidor_e2e
Variables: E2E_DATABASE_URL (por defecto sqlite:///./e2e_test.db) y E2E_API_PORT (por defecto 8010).
Por seguridad rechaza cualquier base cuyo nombre no contenga "test": nunca toca datos reales.
"""

import os
import sys
from pathlib import Path

url = os.environ.get("E2E_DATABASE_URL", "sqlite:///./e2e_test.db")
if "test" not in url.rsplit("/", 1)[-1]:
    sys.exit(f"Base rechazada para E2E (debe llamarse *test*): {url}")
os.environ["DATABASE_URL"] = url
os.environ.setdefault("SOLVER_TIME_LIMIT_S", "5")

if url.startswith("sqlite:///"):
    Path(url.removeprefix("sqlite:///")).unlink(missing_ok=True)

import uvicorn  # noqa: E402

from app import seed  # noqa: E402
from app.db import Base, engine  # noqa: E402

if not url.startswith("sqlite"):
    Base.metadata.drop_all(engine)
seed.run()
uvicorn.run("app.main:app", host="127.0.0.1", port=int(os.environ.get("E2E_API_PORT", "8010")), log_level="warning")
