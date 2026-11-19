"""RF-005 dashboard · RF-006 reporte de sostenibilidad y costo del ciclo de vida · RF-010 plan de compensación."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Compensacion, Configuracion, Pedido, Ruta, Vehiculo
from app.optimization.emisiones import LITROS_POR_GALON, consumo_unidades

ESTADOS_VIGENTES = ("PLANIFICADA", "EN_CURSO", "COMPLETADA")
DEPRECIACION_ANUAL = 0.20  # RES-01 del caso
META_CERO_NETO_ANIOS = 3


def _rutas(db: Session, desde: date | None, hasta: date | None) -> list[Ruta]:
    q = select(Ruta).where(Ruta.estado.in_(ESTADOS_VIGENTES))
    if desde:
        q = q.where(Ruta.fecha >= desde)
    if hasta:
        q = q.where(Ruta.fecha <= hasta)
    return list(db.scalars(q.order_by(Ruta.id)))


def _configuracion(db: Session) -> tuple[float, float]:
    conf = db.get(Configuracion, 1)
    return (conf.precio_diesel_galon, conf.costo_mantenimiento_km) if conf else (17.5, 1.2)


def _ahorro_energia(rutas: list[Ruta]) -> tuple[float, float]:
    """Combustible (L) y electricidad (kWh) ahorrados frente a la ruta secuencial sin optimizar."""
    litros = kwh = 0.0
    for r in rutas:
        ahorro = consumo_unidades(r.distancia_base_km - r.distancia_km, r.vehiculo.rendimiento)
        if r.vehiculo.combustible == "ELECTRICO":
            kwh += ahorro
        else:
            litros += ahorro
    return litros, kwh


def _cumplimiento_ventanas(rutas: list[Ruta]) -> float:
    """% de paradas cuya llegada estimada cae dentro de la ventana del pedido."""
    paradas = [p for r in rutas for p in r.paradas]
    if not paradas:
        return 0.0
    return round(sum(1 for p in paradas if not p.fuera_ventana) / len(paradas) * 100, 1)


def dashboard(db: Session, desde: date | None = None, hasta: date | None = None) -> dict:
    rutas = _rutas(db, desde, hasta)
    precio_galon, _ = _configuracion(db)
    litros, kwh = _ahorro_energia(rutas)
    por_estado = dict(db.execute(select(Pedido.estado, func.count()).group_by(Pedido.estado)).all())
    km = sum(r.distancia_km for r in rutas)
    km_base = sum(r.distancia_base_km for r in rutas)
    co2 = sum(r.co2_kg for r in rutas)
    co2_base = sum(r.co2_base_kg for r in rutas)
    entregas = sum(len(r.paradas) for r in rutas)
    ahorro_soles = round(litros / LITROS_POR_GALON * precio_galon, 2)
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
        "combustible_ahorrado_l": round(litros, 2),
        "electricidad_ahorrada_kwh": round(kwh, 2),
        "ahorro_combustible_soles": ahorro_soles,
        "cumplimiento_ventanas_pct": _cumplimiento_ventanas(rutas),
        "arboles_equivalentes": round((co2_base - co2) / settings.CO2_ABSORBIDO_ARBOL_KG_ANIO, 2),
        # RF-005: lenguaje accesible para conductores y administrativos
        "mensaje": (f"Has ahorrado S/ {ahorro_soles:.2f} en combustible hoy" if rutas
                    else "Aún no hay rutas planificadas"),
    }


def _co2_compensado(db: Session, desde: date | None, hasta: date | None) -> float:
    q = select(func.coalesce(func.sum(Compensacion.co2_kg), 0.0))
    if desde:
        q = q.where(Compensacion.fecha >= desde)
    if hasta:
        q = q.where(Compensacion.fecha <= hasta)
    return float(db.scalar(q) or 0)


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

    compensado = _co2_compensado(db, desde, hasta)
    emitido = sum(r.co2_kg for r in rutas)
    evitado = sum(r.co2_base_kg - r.co2_kg for r in rutas)
    return {
        "periodo": {"desde": desde, "hasta": hasta},
        "co2_emitido_kg": round(emitido, 2),
        "co2_evitado_por_optimizacion_kg": round(evitado, 2),
        "co2_compensado_kg": round(compensado, 2),
        "co2_neto_kg": round(emitido - compensado, 2),
        "creditos_carbono_soles": round(evitado / 1000 * settings.COSTO_TCO2_SOLES, 2),
        "avance_cero_neto_pct": round(min(100.0, compensado / emitido * 100), 1) if emitido else 0.0,
        "por_combustible": por_combustible,
    }


def costo_ciclo_vida(db: Session, desde: date | None = None, hasta: date | None = None) -> dict:
    """RN-017 · Costo del ciclo de vida de la flota: combustible + mantenimiento + depreciación + seguros.

    El combustible y el mantenimiento se calculan con los km del periodo; la depreciación (20 % anual del valor de
    adquisición) y los seguros anuales se prorratean por los días del periodo.
    """
    rutas = _rutas(db, desde, hasta)
    precio_galon, mant_km = _configuracion(db)
    fechas = [r.fecha for r in rutas]
    dias = ((max(fechas) - min(fechas)).days + 1) if fechas else 1
    if desde and hasta:
        dias = (hasta - desde).days + 1
    km_por_vehiculo: dict[int, float] = {}
    for r in rutas:
        km_por_vehiculo[r.vehiculo_id] = km_por_vehiculo.get(r.vehiculo_id, 0.0) + r.distancia_km

    filas, total = [], 0.0
    for veh in db.scalars(select(Vehiculo).where(Vehiculo.activo.is_(True)).order_by(Vehiculo.id)):
        km = km_por_vehiculo.get(veh.id, 0.0)
        unidades = consumo_unidades(km, veh.rendimiento)
        # Precio por unidad: galón de diésel convertido a litro; para otros combustibles se usa la misma referencia
        combustible = 0.0 if veh.combustible == "ELECTRICO" else unidades / LITROS_POR_GALON * precio_galon
        mantenimiento = km * mant_km
        depreciacion = veh.valor_adquisicion_soles * DEPRECIACION_ANUAL * dias / 365
        seguros = veh.seguro_anual_soles * dias / 365
        costo = combustible + mantenimiento + depreciacion + seguros
        total += costo
        filas.append({
            "placa": veh.placa, "tipo": veh.tipo, "combustible": veh.combustible, "km": round(km, 2),
            "combustible_soles": round(combustible, 2), "mantenimiento_soles": round(mantenimiento, 2),
            "depreciacion_soles": round(depreciacion, 2), "seguros_soles": round(seguros, 2),
            "total_soles": round(costo, 2), "costo_por_km": round(costo / km, 2) if km else 0.0,
        })
    return {"dias": dias, "vehiculos": filas, "total_soles": round(total, 2),
            "supuestos": {"precio_diesel_galon": precio_galon, "mantenimiento_km": mant_km,
                          "depreciacion_anual": DEPRECIACION_ANUAL}}


def plan_compensacion(db: Session, desde: date | None = None, hasta: date | None = None) -> dict:
    """Propuesta para neutralizar el CO₂ neto pendiente y avanzar a la meta de cero carbono neto en 3 años."""
    s = sostenibilidad(db, desde, hasta)
    neto = max(0.0, s["co2_neto_kg"])
    arboles = int(-(-neto // settings.CO2_ABSORBIDO_ARBOL_KG_ANIO)) if neto else 0
    return {
        "co2_pendiente_kg": round(neto, 2),
        "meta": f"Operación carbono neutral en {META_CERO_NETO_ANIOS} años",
        "avance_cero_neto_pct": s["avance_cero_neto_pct"],
        "opciones": [
            {
                "accion": "Reforestación con especies nativas (quinual, aliso) con programas de la región Junín",
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
