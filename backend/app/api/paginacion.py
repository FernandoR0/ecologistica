"""Paginacion comun para los listados (12 registros por pagina por defecto)."""

from dataclasses import dataclass

from fastapi import Query, Response
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

POR_PAGINA = 12


@dataclass
class Pagina:
    pagina: int
    limite: int


def params_pagina(
    pagina: int = Query(1, ge=1),
    limite: int = Query(POR_PAGINA, ge=1, le=100),
) -> Pagina:
    return Pagina(pagina, limite)


def paginar(db: Session, consulta: Select, p: Pagina, response: Response) -> list:
    """Aplica OFFSET/LIMIT y devuelve el total en la cabecera X-Total-Count."""
    total = db.scalar(select(func.count()).select_from(consulta.order_by(None).subquery()))
    response.headers["X-Total-Count"] = str(total)
    return list(db.scalars(consulta.offset((p.pagina - 1) * p.limite).limit(p.limite)))
