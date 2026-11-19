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
from app.models import Conductor, Configuracion, Incidente, Parada, Pedido, Ruta, Vehiculo, Zona
from app.optimization import vrptw
from app.optimization.geo import hora_a_min, longitud_recorrido_km, min_a_hora, punto_en_poligono

PRIORIDAD_MOTOR = {"EXPRESS": 1, "ESTANDAR": 2, "ECONOMICO": 3}
DIAS = ("LU", "MA", "MI", "JU", "VI", "SA", "DO")  # isoweekday 1..7


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
            id=1, velocidad_kmh=settings.VELOCIDAD_KMH, velocidad_punta_kmh=settings.VELOCIDAD_PUNTA_KMH,
            factor_vial=settings.FACTOR_VIAL, peso_co2=settings.PESO_CO2, servicio_min=settings.SERVICIO_MIN,
            limite_segundos=settings.SOLVER_TIME_LIMIT_S, precio_diesel_galon=17.5, costo_mantenimiento_km=1.2,
            digitos_placa_restringidos="",
        )
        db.add(conf)
        db.commit()
    return conf


def digitos_restringidos(conf: Configuracion, fecha: date) -> set[str]:
    """RN-005: dígitos de placa que no circulan en el día de la semana de `fecha`."""
    for regla in filter(None, (conf.digitos_placa_restringidos or "").split(";")):
        dia, digitos = regla.split(":")
        if int(dia) == fecha.isoweekday():
            return set(digitos.split(","))
    return set()


def ventana_efectiva(pedido: Pedido, fecha: date) -> tuple[int, int]:
    """RN-007: intersección entre la ventana del pedido y el horario del cliente para ese día."""
    ini, fin = hora_a_min(pedido.ventana_inicio), hora_a_min(pedido.ventana_fin)
    cli = pedido.cliente
    if cli and DIAS[fecha.isoweekday() - 1] in cli.dias_atencion.split(","):
        c_ini, c_fin = hora_a_min(cli.hora_desde), hora_a_min(cli.hora_hasta)
        if max(ini, c_ini) < min(fin, c_fin):
            return max(ini, c_ini), min(fin, c_fin)
    return ini, fin


def _zonas(db: Session, tipo: str) -> list[list[list[float]]]:
    return [z.poligono for z in db.scalars(select(Zona).where(Zona.tipo == tipo, Zona.activa.is_(True)))]


def _flota_disponible(db: Session, fecha: date, excluir: set[int] | None = None) -> list[tuple[Vehiculo, Conductor]]:
    """Vehículos activos con conductor activo asignado y placa habilitada para el día (RN-005)."""
    bloqueados = digitos_restringidos(obtener_configuracion(db), fecha)
    filas = db.execute(
        select(Vehiculo, Conductor)
        .join(Conductor, Conductor.vehiculo_id == Vehiculo.id)
        .where(Vehiculo.activo.is_(True), Conductor.activo.is_(True))
        .order_by(Vehiculo.id)
    ).all()
    vistos: set[int] = set()
    flota = []
    for veh, cond in filas:
        if veh.id in vistos or (excluir and veh.id in excluir) or veh.placa[-1] in bloqueados:
            continue
        vistos.add(veh.id)
        flota.append((veh, cond))
    return flota


def _partida(cond: Conductor) -> tuple[float, float] | None:
    if cond.partida_lat is not None and cond.partida_lng is not None:
        return (cond.partida_lat, cond.partida_lng)
    return None


def _recursos(flota, fecha: date, inicio_min: int | None = None, usar_partida: bool = True):
    recursos = []
    for veh, cond in flota:
        desde, hasta = hora_a_min(cond.disponible_desde), hora_a_min(cond.disponible_hasta)
        inicio = max(desde, inicio_min) if inicio_min is not None else desde
        # Jornada restante: no supera la jornada máxima ni el fin de la disponibilidad del conductor
        restante = min(cond.jornada_max_min - max(0, inicio - desde), hasta - inicio)
        if restante <= 0:
            continue
        recursos.append(
            vrptw.VehiculoRecurso(
                id=veh.id, capacidad_kg=veh.capacidad_kg, volumen_m3=veh.volumen_m3,
                emision_kg_km=veh.factor_emision_kg_km, inicio_min=inicio, jornada_max_min=restante,
                conductor_id=cond.id, origen=_partida(cond) if usar_partida else None,
                puede_entrar_centro=not veh.restringido_en_centro(fecha),
            )
        )
    return recursos


def _nodos(db: Session, pedidos: list[Pedido], fecha: date, servicio_min: int) -> list[vrptw.PedidoNodo]:
    centro = _zonas(db, "RESTRINGIDA")
    nodos = []
    for p in pedidos:
        ini, fin = ventana_efectiva(p, fecha)
        nodos.append(
            vrptw.PedidoNodo(
                id=p.id, lat=p.lat, lng=p.lng, peso_kg=p.peso_kg, volumen_m3=p.volumen_m3,
                ventana_inicio=ini, ventana_fin=fin, servicio_min=servicio_min,
                prioridad=PRIORIDAD_MOTOR.get(p.prioridad, 2), perecedero=p.tipo_producto == "PERECEDERO",
                en_zona_restringida=any(punto_en_poligono(p.lat, p.lng, z) for z in centro),
            )
        )
    return nodos


def _instancia(db: Session, pedidos: list[Pedido], fecha: date, recursos, origen=None) -> vrptw.Instancia:
    conf = obtener_configuracion(db)
    return vrptw.Instancia(
        deposito=(settings.DEPOT_LAT, settings.DEPOT_LNG), pedidos=_nodos(db, pedidos, fecha, conf.servicio_min),
        vehiculos=recursos, velocidad_kmh=conf.velocidad_kmh, velocidad_punta_kmh=conf.velocidad_punta_kmh,
        factor_vial=conf.factor_vial, peso_co2=conf.peso_co2, origen=origen, zonas_riesgo=_zonas(db, "RIESGO"),
    )


def _persistir(
    db: Session, plan: vrptw.Plan, fecha: date, pedidos: dict[int, Pedido], factor_vial: float,
    ruta_origen_id: int | None = None,
) -> list[Ruta]:
    deposito = (settings.DEPOT_LAT, settings.DEPOT_LNG)
    rutas = []
    for rp in plan.rutas:
        veh = db.get(Vehiculo, rp.vehiculo_id)
        inicio = rp.partida or deposito
        # Línea base: mismas paradas en orden de registro (ruta secuencial sin optimizar)
        base_puntos = [inicio] + [(pedidos[i].lat, pedidos[i].lng) for i in sorted(pr.pedido_id for pr in rp.paradas)]
        base_km = max(longitud_recorrido_km(base_puntos + [deposito], factor_vial), rp.distancia_km)
        ruta = Ruta(
            fecha=fecha, vehiculo_id=rp.vehiculo_id, conductor_id=rp.conductor_id,
            hora_inicio=min_a_hora(rp.inicio_min), hora_fin=min_a_hora(rp.fin_min),
            distancia_km=rp.distancia_km, duracion_min=rp.duracion_min, descanso_min=rp.descanso_min,
            co2_kg=rp.co2_kg, distancia_base_km=round(base_km, 3),
            co2_base_kg=round(base_km * veh.factor_emision_kg_km, 3), ruta_origen_id=ruta_origen_id,
            partida_lat=rp.partida[0] if rp.partida else None,
            partida_lng=rp.partida[1] if rp.partida else None,
        )
        for pp in rp.paradas:
            ruta.paradas.append(Parada(
                pedido_id=pp.pedido_id, orden=pp.orden, hora_llegada=min_a_hora(pp.llegada_min),
                distancia_tramo_km=pp.distancia_tramo_km, tiempo_tramo_min=pp.tiempo_tramo_min,
                congestion=pp.congestion, fuera_ventana=pp.fuera_ventana,
            ))
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
    pedidos = list(db.scalars(q.order_by(Pedido.id)).unique())
    if not pedidos:
        raise PlanificacionError("No hay pedidos pendientes para planificar")

    flota = _flota_disponible(db, fecha)
    if not flota:
        raise PlanificacionError("No hay vehículos habilitados con conductor asignado")

    inst = _instancia(db, pedidos, fecha, _recursos(flota, fecha))
    limite = limite_segundos or obtener_configuracion(db).limite_segundos
    return _resolver(db, inst, fecha, pedidos, limite)


def reoptimizar(  # noqa: PLR0913 - parámetros del incidente
    db: Session, ruta_id: int, tipo: str, hora_actual: str, demora_min: int = 0,
    completados: list[int] | None = None, limite_segundos: int = 10, pedido_id: int | None = None,
    descripcion: str | None = None, usuario_id: int | None = None,
) -> Resultado:
    """Replanifica las paradas pendientes de una ruta y registra el incidente.

    - TRAFICO / ACCIDENTE / BLOQUEO_VIA / CLIMA: el mismo vehículo continúa desde su última entrega,
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

    incidente = Incidente(ruta_id=ruta.id, tipo=tipo, hora=hora_actual, demora_min=demora_min,
                          pedido_id=pedido_id, descripcion=descripcion, usuario_id=usuario_id)
    db.add(incidente)

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
            db.rollback()
            raise PlanificacionError("El pedido nuevo debe existir y estar PENDIENTE")
        pedidos.append(nuevo)
    elif tipo == "CANCELACION":
        cancelada = next((p for p in pendientes if p.pedido_id == pedido_id), None)
        if cancelada is None:
            db.rollback()
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
        flota = _flota_disponible(db, ruta.fecha, excluir=ocupados | {ruta.vehiculo_id})
        origen = None
        recursos = _recursos(flota, ruta.fecha, inicio_min=inicio)
    else:
        flota = [(ruta.vehiculo, ruta.conductor)] if ruta.conductor else []
        if ultima:
            origen = (ultima.pedido.lat, ultima.pedido.lng)
        elif ruta.partida_lat is not None:
            origen = (ruta.partida_lat, ruta.partida_lng)
        else:
            origen = deposito
        recursos = _recursos(flota, ruta.fecha, inicio_min=inicio, usar_partida=False)
    if not recursos:
        db.rollback()
        raise PlanificacionError("No hay vehículos disponibles para re-optimizar")

    # Las paradas pendientes salen de la ruta original
    for p in pendientes:
        ruta.paradas.remove(p)
        p.pedido.estado = "PENDIENTE"
    ruta.estado = "REOPTIMIZADA"

    inst = _instancia(db, pedidos, ruta.fecha, recursos, origen=origen)
    res = _resolver(db, inst, ruta.fecha, pedidos, limite_segundos, ruta_origen_id=ruta.id)
    if res.rutas:
        incidente.ruta_nueva_id = res.rutas[0].id
        db.commit()
    return res
