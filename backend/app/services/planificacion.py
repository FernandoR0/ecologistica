"""Casos de uso: planificar rutas (RF-003) y re-optimizar ante incidentes, pedidos nuevos o cancelaciones (RF-007).

Traduce los datos de la BD a una `Instancia` del motor, la resuelve y persiste el resultado.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Conductor, Configuracion, Parada, Pedido, PreferenciaCliente, Ruta, Vehiculo
from app.optimization import vrptw
from app.optimization.emisiones import emision_kg_por_km
from app.optimization.geo import hora_a_min, longitud_recorrido_km, min_a_hora

INCIDENTES = ("TRAFICO", "BLOQUEO_VIA", "CLIMA")


class PlanificacionError(Exception):
    """Error de negocio (se traduce a HTTP 409)."""


@dataclass
class Resultado:
    estado: str
    rutas: list[Ruta] = field(default_factory=list)
    no_asignados: list[int] = field(default_factory=list)
    tiempo_calculo_ms: int = 0


def obtener_configuracion(db: Session) -> Configuracion:
    """Parámetros del motor (RF-012). Si aún no existen, se crean con los valores del `.env`."""
    conf = db.get(Configuracion, 1)
    if conf is None:
        conf = Configuracion(
            id=1, velocidad_kmh=settings.VELOCIDAD_KMH, factor_vial=settings.FACTOR_VIAL,
            peso_co2=settings.PESO_CO2, servicio_min=settings.SERVICIO_MIN,
            limite_segundos=settings.SOLVER_TIME_LIMIT_S, precio_combustible_soles=16.5,
        )
        db.add(conf)
        db.commit()
    return conf


def ventana_efectiva(pedido: Pedido, pref: PreferenciaCliente | None, fecha: date) -> tuple[int, int]:
    """Intersección entre la ventana del pedido y la preferencia del cliente (RF-009)."""
    ini, fin = hora_a_min(pedido.ventana_inicio), hora_a_min(pedido.ventana_fin)
    if pref and str(fecha.isoweekday()) in pref.dias.split(","):
        p_ini, p_fin = hora_a_min(pref.hora_desde), hora_a_min(pref.hora_hasta)
        if max(ini, p_ini) < min(fin, p_fin):
            return max(ini, p_ini), min(fin, p_fin)
    return ini, fin


def _flota_disponible(db: Session, excluir: set[int] | None = None) -> list[tuple[Vehiculo, Conductor]]:
    """Vehículos activos que tienen un conductor activo asignado."""
    filas = db.execute(
        select(Vehiculo, Conductor)
        .join(Conductor, Conductor.vehiculo_id == Vehiculo.id)
        .where(Vehiculo.activo.is_(True), Conductor.activo.is_(True))
        .order_by(Vehiculo.id)
    ).all()
    vistos: set[int] = set()
    flota = []
    for veh, cond in filas:
        if veh.id in vistos or (excluir and veh.id in excluir):
            continue
        vistos.add(veh.id)
        flota.append((veh, cond))
    return flota


def _partida(cond: Conductor) -> tuple[float, float] | None:
    if cond.partida_lat is not None and cond.partida_lng is not None:
        return (cond.partida_lat, cond.partida_lng)
    return None


def _recursos(flota, inicio_min: int | None = None, usar_partida: bool = True) -> list[vrptw.VehiculoRecurso]:
    recursos = []
    for veh, cond in flota:
        inicio_cond = hora_a_min(cond.hora_inicio)
        inicio = max(inicio_cond, inicio_min) if inicio_min is not None else inicio_cond
        restante = cond.jornada_max_min - max(0, inicio - inicio_cond)
        if restante <= 0:
            continue
        recursos.append(
            vrptw.VehiculoRecurso(
                id=veh.id,
                capacidad_kg=veh.capacidad_kg,
                emision_kg_km=emision_kg_por_km(veh.combustible, veh.consumo_100km),
                inicio_min=inicio,
                jornada_max_min=restante,
                conductor_id=cond.id,
                origen=_partida(cond) if usar_partida else None,
            )
        )
    return recursos


def _nodos(db: Session, pedidos: list[Pedido], fecha: date, servicio_min: int) -> list[vrptw.PedidoNodo]:
    clientes = {p.cliente for p in pedidos}
    prefs = {
        pr.cliente: pr
        for pr in db.scalars(select(PreferenciaCliente).where(PreferenciaCliente.cliente.in_(clientes)))
    }
    nodos = []
    for p in pedidos:
        ini, fin = ventana_efectiva(p, prefs.get(p.cliente), fecha)
        nodos.append(
            vrptw.PedidoNodo(
                id=p.id, lat=p.lat, lng=p.lng, peso_kg=p.peso_kg, ventana_inicio=ini, ventana_fin=fin,
                servicio_min=servicio_min, prioridad=p.prioridad,
            )
        )
    return nodos


def _instancia(db: Session, pedidos: list[Pedido], fecha: date, recursos, origen=None) -> vrptw.Instancia:
    conf = obtener_configuracion(db)
    return vrptw.Instancia(
        deposito=(settings.DEPOT_LAT, settings.DEPOT_LNG), pedidos=_nodos(db, pedidos, fecha, conf.servicio_min),
        vehiculos=recursos, velocidad_kmh=conf.velocidad_kmh, factor_vial=conf.factor_vial,
        peso_co2=conf.peso_co2, origen=origen,
    )


def _persistir(
    db: Session, plan: vrptw.Plan, fecha: date, pedidos: dict[int, Pedido], factor_vial: float,
    ruta_origen_id: int | None = None,
) -> list[Ruta]:
    deposito = (settings.DEPOT_LAT, settings.DEPOT_LNG)
    rutas = []
    for rp in plan.rutas:
        veh = db.get(Vehiculo, rp.vehiculo_id)
        emision = emision_kg_por_km(veh.combustible, veh.consumo_100km)
        inicio = rp.partida or deposito
        # Línea base: mismas paradas en orden de registro, sin optimizar
        base_puntos = [inicio] + [(pedidos[i].lat, pedidos[i].lng) for i in sorted(pr.pedido_id for pr in rp.paradas)]
        base_km = longitud_recorrido_km(base_puntos + [deposito], factor_vial)
        ruta = Ruta(
            fecha=fecha, vehiculo_id=rp.vehiculo_id, conductor_id=rp.conductor_id,
            hora_inicio=min_a_hora(rp.inicio_min), hora_fin=min_a_hora(rp.fin_min),
            distancia_km=rp.distancia_km, duracion_min=rp.duracion_min, co2_kg=rp.co2_kg,
            distancia_base_km=round(max(base_km, rp.distancia_km), 3),
            co2_base_kg=round(max(base_km, rp.distancia_km) * emision, 3),
            ruta_origen_id=ruta_origen_id,
            partida_lat=rp.partida[0] if rp.partida else None,
            partida_lng=rp.partida[1] if rp.partida else None,
        )
        for pp in rp.paradas:
            ruta.paradas.append(Parada(pedido_id=pp.pedido_id, orden=pp.orden, hora_llegada=min_a_hora(pp.llegada_min)))
            pedidos[pp.pedido_id].estado = "PLANIFICADO"
        db.add(ruta)
        rutas.append(ruta)
    db.commit()
    for r in rutas:
        db.refresh(r)
    return rutas


def _resolver(db: Session, inst: vrptw.Instancia, fecha: date, pedidos: list[Pedido], limite: int,
              ruta_origen_id: int | None = None) -> Resultado:
    t0 = time.perf_counter()
    plan = vrptw.resolver(inst, limite)
    ms = int((time.perf_counter() - t0) * 1000)
    rutas = _persistir(db, plan, fecha, {p.id: p for p in pedidos}, inst.factor_vial, ruta_origen_id)
    return Resultado(estado=plan.estado, rutas=rutas, no_asignados=plan.no_asignados, tiempo_calculo_ms=ms)


def planificar(
    db: Session, fecha: date, pedido_ids: list[int] | None = None, limite_segundos: int | None = None
) -> Resultado:
    q = select(Pedido).where(Pedido.estado == "PENDIENTE")
    if pedido_ids:
        q = q.where(Pedido.id.in_(pedido_ids))
    pedidos = list(db.scalars(q.order_by(Pedido.id)))
    if not pedidos:
        raise PlanificacionError("No hay pedidos pendientes para planificar")

    flota = _flota_disponible(db)
    if not flota:
        raise PlanificacionError("No hay vehículos activos con conductor asignado")

    inst = _instancia(db, pedidos, fecha, _recursos(flota))
    limite = limite_segundos or obtener_configuracion(db).limite_segundos
    return _resolver(db, inst, fecha, pedidos, limite)


def reoptimizar(
    db: Session, ruta_id: int, tipo: str, hora_actual: str, demora_min: int = 0,
    completados: list[int] | None = None, limite_segundos: int = 10, pedido_id: int | None = None,
) -> Resultado:
    """Replanifica las paradas pendientes de una ruta.

    - TRAFICO / BLOQUEO_VIA / CLIMA: el mismo vehículo continúa desde su última entrega,
      partiendo `demora_min` minutos más tarde; se reordenan las paradas pendientes.
    - AVERIA_VEHICULO: las paradas pendientes se reparten entre los vehículos libres.
    - PEDIDO_NUEVO: se agrega a la ruta un pedido PENDIENTE (`pedido_id`) y se reordena desde la posición actual.
    - CANCELACION: se cancela el pedido `pedido_id` de la ruta y se reordenan las paradas que quedan.
    """
    ruta = db.get(Ruta, ruta_id)
    if ruta is None:
        raise PlanificacionError("Ruta no existe")
    if ruta.estado not in ("PLANIFICADA", "EN_CURSO"):
        raise PlanificacionError(f"No se puede re-optimizar una ruta {ruta.estado}")

    completados_set = set(completados or [])
    ultima = None
    for parada in ruta.paradas:
        if parada.pedido_id in completados_set:
            parada.estado = "ENTREGADA"
            parada.pedido.estado = "ENTREGADO"
        if parada.estado == "ENTREGADA":
            ultima = parada
    pendientes = [p for p in ruta.paradas if p.estado == "PENDIENTE"]
    pedidos = [p.pedido for p in pendientes]

    if tipo == "PEDIDO_NUEVO":
        nuevo = db.get(Pedido, pedido_id) if pedido_id else None
        if nuevo is None or nuevo.estado != "PENDIENTE":
            raise PlanificacionError("El pedido nuevo debe existir y estar PENDIENTE")
        pedidos.append(nuevo)
    elif tipo == "CANCELACION":
        cancelada = next((p for p in pendientes if p.pedido_id == pedido_id), None)
        if cancelada is None:
            raise PlanificacionError("El pedido a cancelar no es una parada pendiente de esta ruta")
        ruta.paradas.remove(cancelada)
        pendientes.remove(cancelada)
        cancelada.pedido.estado = "CANCELADO"
        pedidos = [p.pedido for p in pendientes]

    if not pedidos:
        ruta.estado = "COMPLETADA"
        db.commit()
        return Resultado(estado="SIN_PEDIDOS")

    inicio = hora_a_min(hora_actual) + demora_min
    deposito = (settings.DEPOT_LAT, settings.DEPOT_LNG)
    if tipo == "AVERIA_VEHICULO":
        ocupados = set(
            db.scalars(
                select(Ruta.vehiculo_id).where(Ruta.fecha == ruta.fecha, Ruta.estado.in_(("PLANIFICADA", "EN_CURSO")))
            )
        )
        flota = _flota_disponible(db, excluir=ocupados | {ruta.vehiculo_id})
        origen = None
        recursos = _recursos(flota, inicio_min=inicio)
    else:
        flota = [(ruta.vehiculo, ruta.conductor)] if ruta.conductor else []
        if ultima:
            origen = (ultima.pedido.lat, ultima.pedido.lng)
        elif ruta.partida_lat is not None:
            origen = (ruta.partida_lat, ruta.partida_lng)
        else:
            origen = deposito
        recursos = _recursos(flota, inicio_min=inicio, usar_partida=False)
    if not recursos:
        raise PlanificacionError("No hay vehículos disponibles para re-optimizar")

    # Las paradas pendientes salen de la ruta original
    for p in pendientes:
        ruta.paradas.remove(p)
        p.pedido.estado = "PENDIENTE"
    ruta.estado = "REOPTIMIZADA"

    inst = _instancia(db, pedidos, ruta.fecha, recursos, origen=origen)
    return _resolver(db, inst, ruta.fecha, pedidos, limite_segundos, ruta_origen_id=ruta.id)
