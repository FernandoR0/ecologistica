"""RF-012 · Configuración del motor, zonas, bitácora de auditoría y gestión de usuarios.

Permisos según la matriz RBAC (docs/01 Inicio/08. Usuarios): el ADMIN modifica; el AUDITOR solo consulta y exporta.
"""

import csv
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, solo_admin
from app.api.paginacion import Pagina, paginar, params_pagina
from app.db import get_db
from app.models import Auditoria, Usuario, Zona
from app.schemas import (
    AuditoriaOut,
    ConfiguracionIn,
    ConfiguracionOut,
    UsuarioOut,
    UsuarioUpdate,
    ZonaIn,
    ZonaOut,
)
from app.services.planificacion import obtener_configuracion

router = APIRouter(tags=["Administración"])
admin_o_auditor = require_roles("ADMIN", "AUDITOR")
lectura_configuracion = require_roles("ADMIN", "PLANIFICADOR", "AUDITOR")


@router.get("/configuracion", response_model=ConfiguracionOut)
def ver_configuracion(db: Session = Depends(get_db), _=Depends(lectura_configuracion)):
    return obtener_configuracion(db)


@router.put("/configuracion", response_model=ConfiguracionOut)
def guardar_configuracion(datos: ConfiguracionIn, db: Session = Depends(get_db), _=Depends(solo_admin)):
    conf = obtener_configuracion(db)
    for k, v in datos.model_dump().items():
        setattr(conf, k, v)
    db.commit()
    return conf


def _consulta_auditoria(correo: str | None):
    q = select(Auditoria).order_by(Auditoria.id.desc())
    if correo:
        q = q.where(Auditoria.correo == correo.lower())
    return q


@router.get("/auditoria", response_model=list[AuditoriaOut])
def ver_auditoria(
    response: Response,
    correo: str | None = None,
    p: Pagina = Depends(params_pagina),
    db: Session = Depends(get_db),
    _=Depends(admin_o_auditor),
):
    return paginar(db, _consulta_auditoria(correo), p, response)


@router.get("/auditoria/exportar.csv", response_class=Response)
def exportar_auditoria(correo: str | None = None, db: Session = Depends(get_db), _=Depends(admin_o_auditor)):
    """Exportación de logs de auditoría (máximo 5 000 registros más recientes)."""
    salida = StringIO()
    escritor = csv.writer(salida)
    escritor.writerow(["id", "fecha", "usuario_id", "correo", "accion", "recurso", "estado_http"])
    for a in db.scalars(_consulta_auditoria(correo).limit(5000)):
        escritor.writerow([a.id, a.fecha.isoformat(), a.usuario_id or "", a.correo or "", a.accion, a.recurso,
                           a.estado_http])
    return Response(salida.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": 'attachment; filename="auditoria.csv"'})


@router.get("/zonas", response_model=list[ZonaOut])
def listar_zonas(tipo: str | None = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = select(Zona).where(Zona.activa.is_(True)).order_by(Zona.id)
    if tipo:
        q = q.where(Zona.tipo == tipo.upper())
    return db.scalars(q).all()


@router.post("/zonas", response_model=ZonaOut, status_code=201)
def crear_zona(datos: ZonaIn, db: Session = Depends(get_db), _=Depends(solo_admin)):
    zona = Zona(nombre=datos.nombre, tipo=datos.tipo, activa=datos.activa,
                poligono=[[lat, lng] for lat, lng in datos.poligono])
    db.add(zona)
    db.commit()
    return zona


@router.delete("/zonas/{zona_id}", status_code=204)
def eliminar_zona(zona_id: int, db: Session = Depends(get_db), _=Depends(solo_admin)):
    """Eliminación física: solo el ADMIN (RN-013)."""
    zona = db.get(Zona, zona_id)
    if zona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Zona no existe")
    db.delete(zona)
    db.commit()
    return Response(status_code=204)


@router.put("/auth/usuarios/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: Session = Depends(get_db),
                       admin: Usuario = Depends(solo_admin)):
    user = db.get(Usuario, usuario_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no existe")
    if user.id == admin.id and (datos.activo is False or (datos.rol and datos.rol != "ADMIN")):
        raise HTTPException(status.HTTP_409_CONFLICT, "No puede desactivarse ni quitarse el rol de administrador")
    for k, v in datos.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    return user
