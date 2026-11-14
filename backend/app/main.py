"""Punto de entrada de la API EcoLogística."""

import hashlib
import logging
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routers import admin, auth, gestion, indicadores, rutas
from app.core import cache
from app.core.config import DEV_SECRET, settings
from app.core.security import decode_token
from app.db import Base, SessionLocal, engine, get_db
from app.models import Auditoria

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
    description="Optimización de rutas sostenibles de última milla (VRPTW + Green VRP) - DistriRápido S.A.C.",
    lifespan=lifespan,
)


@app.middleware("http")
async def cabeceras_seguridad(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resp


def _registrar(request: Request, estado: int) -> None:
    """Guarda en la bitácora quién hizo qué (OWASP A09). Nunca guarda contraseñas ni cuerpos."""
    usuario_id, correo = None, None
    cabecera = request.headers.get("authorization", "")
    if cabecera.lower().startswith("bearer "):
        try:
            datos = decode_token(cabecera[7:])
            usuario_id, correo = int(datos["sub"]), datos.get("correo")
        except (jwt.PyJWTError, KeyError, ValueError):
            log.info("Escritura con token inválido en %s", request.url.path)
    if request.url.path == "/api/auth/login":
        correo = getattr(request.state, "correo_login", None)
    fabrica = app.dependency_overrides.get(get_db)
    if fabrica:
        obtenido = fabrica()
        db = next(obtenido) if hasattr(obtenido, "__next__") else obtenido
    else:
        db = SessionLocal()
    try:
        db.add(Auditoria(usuario_id=usuario_id, correo=correo, accion="LOGIN" if request.url.path.endswith("/login")
                         else request.method, recurso=request.url.path[:200], estado_http=estado))
        db.commit()
    finally:
        if not fabrica:
            db.close()


@app.middleware("http")
async def auditoria(request: Request, call_next):
    resp = await call_next(request)
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.url.path.startswith("/api/"):
        _registrar(request, resp.status_code)
    return resp


@app.middleware("http")
async def etag_y_cache(request: Request, call_next):
    """ETag en las respuestas GET de la API: si el cliente ya tiene la misma versión responde 304 sin cuerpo.

    Cualquier escritura limpia la cache de indicadores del servidor.
    """
    resp = await call_next(request)
    if request.method != "GET":
        if resp.status_code < 400:
            cache.limpiar()
        return resp
    if (
        resp.status_code != 200
        or not request.url.path.startswith("/api/")
        or not resp.headers.get("content-type", "").startswith("application/json")
    ):
        return resp

    cuerpo = b"".join([parte async for parte in resp.body_iterator])
    etag = 'W/"' + hashlib.blake2b(cuerpo, digest_size=10).hexdigest() + '"'
    cabeceras = {k: v for k, v in resp.headers.items() if k.lower() != "content-length"}
    cabeceras["ETag"] = etag
    cabeceras["Cache-Control"] = "private, no-cache"
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers={"ETag": etag, "Cache-Control": "private, no-cache"})
    return Response(cuerpo, status_code=200, headers=cabeceras)


# Comprime con gzip las respuestas mayores a 1 KB (JSON de pedidos y rutas)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.lista_cors,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "If-None-Match"],
    expose_headers=["X-Total-Count", "ETag"],
)

for r in (auth.router, admin.router, gestion.vehiculos, gestion.conductores, gestion.pedidos, gestion.preferencias,
          rutas.router, indicadores.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["Sistema"])
def health():
    return {"status": "ok"}
