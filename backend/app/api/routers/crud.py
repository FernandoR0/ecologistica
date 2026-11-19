"""Fábrica de routers CRUD con baja lógica (campo `activo`), validación opcional y paginación."""

from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import gestion, get_current_user
from app.api.paginacion import Pagina, paginar, params_pagina
from app.db import Base, get_db


def crud_router(  # noqa: PLR0913 - configuración declarativa del router
    *, model: type[Base], entrada: type[BaseModel], cambio: type[BaseModel], salida: type[BaseModel],
    prefix: str, tag: str, validar: Callable[[Session, Base], None] | None = None,
    duplicado: str = "Registro duplicado o referencia inválida",
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    def _obtener(db: Session, item_id: int):
        obj = db.get(model, item_id)
        if obj is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{tag}: registro {item_id} no existe")
        return obj

    def _guardar(db: Session, obj) -> None:
        if validar:
            try:
                validar(db, obj)
            except HTTPException:
                db.rollback()
                raise
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, duplicado) from None
        db.refresh(obj)

    @router.get("", response_model=list[salida])
    def listar(
        response: Response,
        activo: bool | None = None,
        p: Pagina = Depends(params_pagina),
        db: Session = Depends(get_db),
        _=Depends(get_current_user),
    ):
        q = select(model).order_by(model.id)
        if activo is not None:
            q = q.where(model.activo == activo)
        return paginar(db, q, p, response)

    @router.get("/{item_id}", response_model=salida)
    def obtener(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
        return _obtener(db, item_id)

    @router.post("", response_model=salida, status_code=201)
    def crear(datos: entrada, db: Session = Depends(get_db), _=Depends(gestion)):  # type: ignore[valid-type]
        obj = model(**datos.model_dump())
        db.add(obj)
        _guardar(db, obj)
        return obj

    @router.put("/{item_id}", response_model=salida)
    def actualizar(item_id: int, datos: cambio, db: Session = Depends(get_db), _=Depends(gestion)):  # type: ignore[valid-type]
        obj = _obtener(db, item_id)
        for k, v in datos.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        _guardar(db, obj)
        return obj

    @router.delete("/{item_id}", status_code=204)
    def desactivar(item_id: int, db: Session = Depends(get_db), _=Depends(gestion)):
        obj = _obtener(db, item_id)
        obj.activo = False
        db.commit()
        return Response(status_code=204)

    return router
