"""RF-005 dashboard · RF-006 reporte de sostenibilidad · RF-010 plan de compensación."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Compensacion, Pedido, Ruta, Vehiculo

ESTADOS_VIGENTES = ("PLANIFICADA", "EN_CURSO", "COMPLETADA")


def _rutas(db: Session, desde: date | None, hasta: date | None):
    q = select(Ruta).where(Ruta.estado.in_(ESTADOS_VIGENTES))
    if desde:
        q = q.where(Ruta.fecha >= desde)
    if hasta:
        q = q.where(Ruta.fecha <= hasta)
    return list(db.scalars(q))


def dashboard(db: Session, desde: date | None = None, hasta: date | None = None) -> dict:
    rutas = _rutas(db, desde, hasta)
    por_estado = dict(db.execute(select(Pedido.estado, func.count()).group_by(Pedido.estado)).all())
    km = sum(r.distancia_km for r in rutas)
    km_base = sum(r.distancia_base_km for r in rutas)
    co2 = sum(r.co2_kg for r in rutas)
    co2_base = sum(r.co2_base_kg for r in rutas)
    entregas = sum(len(r.paradas) for r in rutas)
    vehiculos_activos = db.scalar(select(func.count()).select_from(Vehiculo).where(Vehiculo.activo.is_(True)))
    return {
        "pedidos_por_estado": por_estado,
        "rutas": len(rutas),
        "vehiculos_activos": vehiculos_activos,
        "entregas_planificadas": entregas,
        "distancia_km": round(km, 2),
        "ahorro_km": round(km_base - km, 2),
        "ahorro_km_pct": round((km_base - km) / km_base * 100, 1) if km_base else 0.0,
        "co2_kg": round(co2, 2),
        "ahorro_co2_kg": round(co2_base - co2, 2),
        "co2_por_entrega_kg": round(co2 / entregas, 3) if entregas else 0.0,
    }


def sostenibilidad(db: Session, desde: date | None = None, hasta: date | None = None) -> dict:
    rutas = _rutas(db, desde, hasta)
    por_combustible: dict[str, dict] = {}
    for r in rutas:
        fila = por_combustible.setdefault(r.vehiculo.combustible, {"km": 0.0, "co2_kg": 0.0, "rutas": 0})
        fila["km"] += r.distancia_km
        fila["co2_kg"] += r.co2_kg
        fila["rutas"] += 1
    for fila in por_combustible.values():
        fila["km"] = round(fila["km"], 2)
        fila["co2_kg"] = round(fila["co2_kg"], 2)

    q = select(func.coalesce(func.sum(Compensacion.co2_kg), 0.0))
    if desde:
        q = q.where(Compensacion.fecha >= desde)
    if hasta:
        q = q.where(Compensacion.fecha <= hasta)
    compensado = float(db.scalar(q) or 0)
    emitido = sum(r.co2_kg for r in rutas)
    evitado = sum(r.co2_base_kg - r.co2_kg for r in rutas)
    return {
        "periodo": {"desde": desde, "hasta": hasta},
        "co2_emitido_kg": round(emitido, 2),
        "co2_evitado_por_optimizacion_kg": round(evitado, 2),
        "co2_compensado_kg": round(compensado, 2),
        "co2_neto_kg": round(emitido - compensado, 2),
        "por_combustible": por_combustible,
    }


def plan_compensacion(db: Session, desde: date | None = None, hasta: date | None = None) -> dict:
    """Propuesta para neutralizar el CO₂ neto pendiente (valores estimados)."""
    neto = max(0.0, sostenibilidad(db, desde, hasta)["co2_neto_kg"])
    arboles = int(-(-neto // settings.CO2_ABSORBIDO_ARBOL_KG_ANIO)) if neto else 0
    return {
        "co2_pendiente_kg": round(neto, 2),
        "opciones": [
            {
                "accion": "Reforestación con especies nativas (quinual, aliso) en el Valle del Mantaro",
                "arboles_necesarios_por_anio": arboles,
                "supuesto": f"{settings.CO2_ABSORBIDO_ARBOL_KG_ANIO} kg CO₂ absorbidos por árbol al año",
            },
            {
                "accion": "Compra de bonos de carbono certificados",
                "costo_estimado_soles": round(neto / 1000 * settings.COSTO_TCO2_SOLES, 2),
                "supuesto": f"S/ {settings.COSTO_TCO2_SOLES} por tonelada de CO₂",
            },
        ],
    }
