"""Motor VRPTW + Green VRP con Google OR-Tools y la metaheurística Búsqueda Tabú (RF-003).

Restricciones duras:
- Capacidad de cada vehículo en peso (kg) y volumen (m³) (RN-002).
- Jornada máxima del conductor, reservando 60 min de descanso cuando supera 4 horas (RN-004).
- Zona restringida del Centro: los vehículos no permitidos no atienden esos pedidos (RN-006).

Restricciones blandas (con costo):
- Ventana de entrega: se permite llegar hasta `tardanza_max_min` tarde con una penalidad por minuto (RN-003).
- Tramos que atraviesan zonas de riesgo: su costo se multiplica por 1,5 (RN-010).

Objetivo (Green VRP): minimizar Σ distancia × (1 + peso_co2 × emisión_relativa_del_vehículo) × riesgo.
Los pedidos que no caben se descartan con una penalidad según prioridad y tipo de producto (RN-008).

Tras resolver, una simulación recalcula las llegadas con el perfil de velocidad de hora punta (RN-011), inserta
los descansos y calcula distancia, tiempo y congestión de cada tramo (RF-004).

El módulo es puro: no conoce la base de datos ni HTTP.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.optimization.geo import matriz_distancias_km, nivel_congestion, tramo_cruza, velocidad_en

HORIZONTE_MIN = 24 * 60
ESPERA_MAX_MIN = 240
PENALIZACION_BASE = 10_000_000
CONDUCCION_ANTES_DE_DESCANSO = 240  # minutos (RN-004)
DESCANSO_MIN = 60
PESO_PRIORIDAD = {1: 3, 2: 2, 3: 1}  # express · estándar · económico


@dataclass(frozen=True)
class PedidoNodo:
    id: int
    lat: float
    lng: float
    peso_kg: float
    ventana_inicio: int  # minutos desde medianoche
    ventana_fin: int
    servicio_min: int = 10
    prioridad: int = 2  # 1 express · 2 estándar · 3 económico
    volumen_m3: float = 0.0
    perecedero: bool = False
    en_zona_restringida: bool = False


@dataclass(frozen=True)
class VehiculoRecurso:
    id: int
    capacidad_kg: float
    emision_kg_km: float
    inicio_min: int = 8 * 60
    jornada_max_min: int = 8 * 60
    conductor_id: int | None = None
    origen: tuple[float, float] | None = None  # punto de partida propio del conductor
    volumen_m3: float = 1_000.0
    puede_entrar_centro: bool = True


@dataclass
class Instancia:
    deposito: tuple[float, float]
    pedidos: list[PedidoNodo]
    vehiculos: list[VehiculoRecurso]
    velocidad_kmh: float = 25.0
    velocidad_punta_kmh: float = 15.0
    factor_vial: float = 1.3
    peso_co2: float = 1.0
    # Punto de partida distinto del depósito (re-optimización en ruta, RF-007)
    origen: tuple[float, float] | None = None
    zonas_riesgo: list[list[list[float]]] = field(default_factory=list)
    multiplicador_riesgo: float = 1.5
    tardanza_max_min: int = 60
    penalidad_tardanza_min: int = 500  # equivale a 0,5 km de recorrido por minuto de retraso


@dataclass
class ParadaPlan:
    pedido_id: int
    orden: int
    llegada_min: int
    distancia_tramo_km: float = 0.0
    tiempo_tramo_min: int = 0
    congestion: str = "VERDE"
    fuera_ventana: bool = False


@dataclass
class RutaPlan:
    vehiculo_id: int
    conductor_id: int | None
    paradas: list[ParadaPlan]
    distancia_km: float
    co2_kg: float
    inicio_min: int
    fin_min: int
    partida: tuple[float, float] | None = None  # None = depósito
    descanso_min: int = 0

    @property
    def duracion_min(self) -> int:
        return self.fin_min - self.inicio_min


@dataclass
class Plan:
    estado: str  # FACTIBLE · SIN_SOLUCION · SIN_PEDIDOS
    rutas: list[RutaPlan] = field(default_factory=list)
    no_asignados: list[int] = field(default_factory=list)

    @property
    def distancia_total_km(self) -> float:
        return round(sum(r.distancia_km for r in self.rutas), 3)

    @property
    def co2_total_kg(self) -> float:
        return round(sum(r.co2_kg for r in self.rutas), 3)


def _viaje(distancia_km: float, salida_min: int, inst: Instancia) -> tuple[int, float]:
    """Simula el viaje minuto a minuto con el perfil de velocidad; devuelve (minutos, velocidad media)."""
    if distancia_km <= 0:
        return 0, inst.velocidad_kmh
    restante, minuto, exacto = distancia_km, 0, 0.0
    while restante > 1e-9 and minuto < HORIZONTE_MIN:
        avance = velocidad_en(salida_min + minuto, inst.velocidad_kmh, inst.velocidad_punta_kmh) / 60.0
        exacto += min(1.0, restante / avance)
        restante -= avance
        minuto += 1
    return minuto, distancia_km / (exacto / 60.0)


def _simular(nodos: list[int], inicio: int, inst: Instancia, dist, offset: int) -> tuple[list[ParadaPlan], int, int]:
    """Recalcula llegadas con hora punta y descansos. `nodos` incluye el inicio y el depósito final."""
    reloj, desde_descanso, descanso_total = inicio, 0, 0
    paradas: list[ParadaPlan] = []
    for a, b in zip(nodos, nodos[1:], strict=False):
        if desde_descanso >= CONDUCCION_ANTES_DE_DESCANSO:
            reloj += DESCANSO_MIN
            descanso_total += DESCANSO_MIN
            desde_descanso = 0
        minutos, vel = _viaje(dist[a][b], reloj, inst)
        reloj += minutos
        desde_descanso += minutos
        if b < offset:
            continue  # regreso al depósito
        p = inst.pedidos[b - offset]
        llegada = max(reloj, p.ventana_inicio)
        desde_descanso += llegada - reloj  # la espera también cuenta como tiempo en ruta
        paradas.append(
            ParadaPlan(
                pedido_id=p.id, orden=len(paradas) + 1, llegada_min=llegada,
                distancia_tramo_km=round(dist[a][b], 3), tiempo_tramo_min=minutos,
                congestion=nivel_congestion(vel), fuera_ventana=llegada > p.ventana_fin,
            )
        )
        reloj = llegada + p.servicio_min
        desde_descanso += p.servicio_min
    return paradas, reloj, descanso_total


def resolver(inst: Instancia, limite_segundos: int = 30) -> Plan:
    """Resuelve la instancia y devuelve el plan de rutas."""
    if not inst.pedidos:
        return Plan(estado="SIN_PEDIDOS")
    if not inst.vehiculos:
        return Plan(estado="SIN_SOLUCION", no_asignados=[p.id for p in inst.pedidos])

    # Nodos: 0 = depósito, luego un nodo por cada punto de partida distinto, luego los pedidos.
    # Cada vehículo sale de su propio punto de partida (RF-008), del origen de la re-optimización
    # (RF-007) o del depósito, y siempre termina en el depósito.
    puntos = [inst.deposito]
    inicios: list[int] = []
    for veh in inst.vehiculos:
        partida = veh.origen or inst.origen
        if partida is None:
            inicios.append(0)
            continue
        if partida not in puntos:
            puntos.append(partida)
        inicios.append(puntos.index(partida))
    offset = len(puntos)
    puntos += [(p.lat, p.lng) for p in inst.pedidos]
    dist = matriz_distancias_km(puntos, inst.factor_vial)
    n = len(puntos)
    riesgo = [[1.0] * n for _ in range(n)]
    if inst.zonas_riesgo:
        for i in range(n):
            for j in range(n):
                if i != j and any(tramo_cruza(puntos[i], puntos[j], z) for z in inst.zonas_riesgo):
                    riesgo[i][j] = inst.multiplicador_riesgo

    nv = len(inst.vehiculos)
    manager = pywrapcp.RoutingIndexManager(n, nv, inicios, [0] * nv)
    routing = pywrapcp.RoutingModel(manager)

    # --- Costo por vehículo: distancia ponderada por emisiones y riesgo (RN-010) ---
    emax = max(v.emision_kg_km for v in inst.vehiculos) or 1.0
    for v_idx, veh in enumerate(inst.vehiculos):
        factor = 1.0 + inst.peso_co2 * veh.emision_kg_km / emax

        def costo(i: int, j: int, f: float = factor) -> int:
            a, b = manager.IndexToNode(i), manager.IndexToNode(j)
            return int(round(dist[a][b] * 1000 * f * riesgo[a][b]))

        routing.SetArcCostEvaluatorOfVehicle(routing.RegisterTransitCallback(costo), v_idx)

    # --- Capacidad en peso (décimas de kg) y volumen (litros) (RN-002) ---
    def demanda_peso(i: int) -> int:
        nodo = manager.IndexToNode(i)
        return 0 if nodo < offset else math.ceil(inst.pedidos[nodo - offset].peso_kg * 10)

    def demanda_volumen(i: int) -> int:
        nodo = manager.IndexToNode(i)
        return 0 if nodo < offset else math.ceil(inst.pedidos[nodo - offset].volumen_m3 * 1000)

    routing.AddDimensionWithVehicleCapacity(
        routing.RegisterUnaryTransitCallback(demanda_peso), 0,
        [int(v.capacidad_kg * 10) for v in inst.vehiculos], True, "Capacidad",
    )
    routing.AddDimensionWithVehicleCapacity(
        routing.RegisterUnaryTransitCallback(demanda_volumen), 0,
        [int(v.volumen_m3 * 1000) for v in inst.vehiculos], True, "Volumen",
    )

    # --- Tiempo: servicio en el nodo de salida + viaje a velocidad media ---
    def tiempo(i: int, j: int) -> int:
        a, b = manager.IndexToNode(i), manager.IndexToNode(j)
        servicio = 0 if a < offset else inst.pedidos[a - offset].servicio_min
        return servicio + math.ceil(dist[a][b] / inst.velocidad_kmh * 60)

    routing.AddDimension(routing.RegisterTransitCallback(tiempo), ESPERA_MAX_MIN, HORIZONTE_MIN, False, "Tiempo")
    t_dim = routing.GetDimensionOrDie("Tiempo")

    for k, p in enumerate(inst.pedidos):
        idx = manager.NodeToIndex(k + offset)
        # Ventana blanda: se puede llegar tarde con penalidad por minuto (RN-003)
        t_dim.CumulVar(idx).SetRange(p.ventana_inicio, min(p.ventana_fin + inst.tardanza_max_min, HORIZONTE_MIN))
        t_dim.SetCumulVarSoftUpperBound(idx, p.ventana_fin, inst.penalidad_tardanza_min)
        peso = PESO_PRIORIDAD.get(max(1, min(3, p.prioridad)), 2) + (1 if p.perecedero else 0)
        routing.AddDisjunction([idx], PENALIZACION_BASE * peso)
        if p.en_zona_restringida:
            permitidos = [v for v, veh in enumerate(inst.vehiculos) if veh.puede_entrar_centro]
            # Lista vacía en OR-Tools significa "todos": si nadie puede entrar, el pedido solo puede descartarse
            routing.VehicleVar(idx).SetValues([-1, *permitidos])

    for v_idx, veh in enumerate(inst.vehiculos):
        inicio = routing.Start(v_idx)
        t_dim.CumulVar(inicio).SetRange(veh.inicio_min, min(veh.inicio_min + ESPERA_MAX_MIN, HORIZONTE_MIN))
        # Se reserva el descanso obligatorio dentro de la jornada (RN-004)
        reserva = DESCANSO_MIN if veh.jornada_max_min > CONDUCCION_ANTES_DE_DESCANSO else 0
        t_dim.SetSpanUpperBoundForVehicle(max(30, veh.jornada_max_min - reserva), v_idx)
        routing.AddVariableMinimizedByFinalizer(t_dim.CumulVar(inicio))
        routing.AddVariableMinimizedByFinalizer(t_dim.CumulVar(routing.End(v_idx)))

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    # Metaheurística: Búsqueda Tabú (una de las que pide el caso: GA, Tabú, ACO o SA)
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.TABU_SEARCH
    params.time_limit.seconds = max(1, int(limite_segundos))

    solucion = routing.SolveWithParameters(params)
    if solucion is None:
        return Plan(estado="SIN_SOLUCION", no_asignados=[p.id for p in inst.pedidos])

    plan = Plan(estado="FACTIBLE")
    for v_idx, veh in enumerate(inst.vehiculos):
        idx = routing.Start(v_idx)
        nodos = [manager.IndexToNode(idx)]
        while not routing.IsEnd(idx):
            idx = solucion.Value(routing.NextVar(idx))
            nodos.append(manager.IndexToNode(idx))
        if len(nodos) <= 2:
            continue
        inicio_min = solucion.Min(t_dim.CumulVar(routing.Start(v_idx)))
        paradas, fin_min, descanso = _simular(nodos, inicio_min, inst, dist, offset)
        km = sum(dist[a][b] for a, b in zip(nodos, nodos[1:], strict=False))
        plan.rutas.append(
            RutaPlan(
                vehiculo_id=veh.id,
                conductor_id=veh.conductor_id,
                paradas=paradas,
                distancia_km=round(km, 3),
                co2_kg=round(km * veh.emision_kg_km, 3),
                inicio_min=inicio_min,
                fin_min=fin_min,
                partida=puntos[inicios[v_idx]] if inicios[v_idx] else None,
                descanso_min=descanso,
            )
        )

    for k, p in enumerate(inst.pedidos):
        idx = manager.NodeToIndex(k + offset)
        if solucion.Value(routing.NextVar(idx)) == idx:
            plan.no_asignados.append(p.id)
    return plan
