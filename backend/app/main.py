"""Punto de entrada de la API EcoLogística."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, gestion, indicadores, rutas
from app.core.config import DEV_SECRET, settings
from app.db import Base, engine

log = logging.getLogger("ecologistica")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    if settings.JWT_SECRET == DEV_SECRET and not settings.DATABASE_URL.startswith("sqlite"):
        log.warning("JWT_SECRET usa el valor de desarrollo: defínalo en .env antes de desplegar")
    yield


app = FastAPI(
    title="EcoLogística API",
    version="1.0.0",
    description="Optimización de rutas sostenibles de última milla (VRPTW + Green VRP) — DistriRápido S.A.C.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def cabeceras_seguridad(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resp


for r in (auth.router, gestion.vehiculos, gestion.conductores, gestion.pedidos, gestion.preferencias,
          rutas.router, indicadores.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["Sistema"])
def health():
    return {"status": "ok"}
