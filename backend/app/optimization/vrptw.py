"""Motor VRPTW + Green VRP con Google OR-Tools (RF-003).

Restricciones duras:
- Capacidad de carga de cada vehículo (kg).
- Ventana horaria de cada pedido (incluye la preferencia del cliente, RF-009).
- Jornada máxima del conductor asignado al vehículo (RF-008).

Metaheurística: Búsqueda Tabú sobre una solución inicial "Path Cheapest Arc".

Objetivo (Green VRP): minimizar Σ distancia × (1 + peso_co2 × emisión_relativa_del_vehículo).
Con peso_co2 > 0 el motor prefiere los vehículos menos contaminantes para los tramos largos.

Si un pedido no cabe en ninguna ruta factible, se descarta con una penalización
proporcional a su prioridad y se informa en `Plan.no_asignados` (no se cae todo el plan).

El módulo es puro: no conoce la base de datos ni HTTP.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.optimization.geo import matriz_distancias_km

HORIZONTE_MIN = 24 * 60
ESPERA_MAX_MIN = 240
PENALIZACION_BASE = 10_000_000


@dataclass(frozen=True)
class PedidoNodo:
    id: int
    lat: float
    lng: float
    peso_kg: float
    ventana_inicio: int  # minutos desde medianoche
    ventana_fin: int
    servicio_min: int = 10
    prioridad: int = 2  # 1 alta · 3 baja


@dataclass(frozen=True)
class VehiculoRecurso:
    id: int
    capacidad_kg: float
    emision_kg_km: float
    inicio_min: int = 8 * 60
    jornada_max_min: int = 8 * 60
    conductor_id: int | None = None
    origen: tuple[float, float] | None = None  # punto de partida propio del conductor


@dataclass
class Instancia:
    deposito: tuple[float, float]
    pedidos: list[PedidoNodo]
    vehiculos: list[VehiculoRecurso]
    velocidad_kmh: float = 25.0
    factor_vial: float = 1.3
    peso_co2: float = 1.0
    # Punto de partida distinto del depósito (re-optimización en ruta, RF-007)
    origen: tuple[float, float] | None = None


@dataclass
class ParadaPlan:
    pedido_id: int
    orden: int
    llegada_min: int


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

    nv = len(inst.vehiculos)
    manager = pywrapcp.RoutingIndexManager(len(puntos), nv, inicios, [0] * nv)
    routing = pywrapcp.RoutingModel(manager)

    # --- Costo por vehículo (distancia ponderada por emisiones) ---
    emax = max(v.emision_kg_km for v in inst.vehiculos) or 1.0
    for v_idx, veh in enumerate(inst.vehiculos):
        factor = 1.0 + inst.peso_co2 * veh.emision_kg_km / emax

        def costo(i: int, j: int, f: float = factor) -> int:
            return int(round(dist[manager.IndexToNode(i)][manager.IndexToNode(j)] * 1000 * f))

        routing.SetArcCostEvaluatorOfVehicle(routing.RegisterTransitCallback(costo), v_idx)

    # --- Capacidad (décimas de kg) ---
    def demanda(i: int) -> int:
        nodo = manager.IndexToNode(i)
        return 0 if nodo < offset else math.ceil(inst.pedidos[nodo - offset].peso_kg * 10)

    routing.AddDimensionWithVehicleCapacity(
        routing.RegisterUnaryTransitCallback(demanda),
        0,
        [int(v.capacidad_kg * 10) for v in inst.vehiculos],
        True,
        "Capacidad",
    )

    # --- Tiempo: servicio en el nodo de salida + viaje ---
    def tiempo(i: int, j: int) -> int:
        a, b = manager.IndexToNode(i), manager.IndexToNode(j)
        servicio = 0 if a < offset else inst.pedidos[a - offset].servicio_min
        return servicio + math.ceil(dist[a][b] / inst.velocidad_kmh * 60)

    routing.AddDimension(routing.RegisterTransitCallback(tiempo), ESPERA_MAX_MIN, HORIZONTE_MIN, False, "Tiempo")
    t_dim = routing.GetDimensionOrDie("Tiempo")

    for k, p in enumerate(inst.pedidos):
        idx = manager.NodeToIndex(k + offset)
        t_dim.CumulVar(idx).SetRange(p.ventana_inicio, p.ventana_fin)
        routing.AddDisjunction([idx], PENALIZACION_BASE * (4 - max(1, min(3, p.prioridad))))

    for v_idx, veh in enumerate(inst.vehiculos):
        inicio = routing.Start(v_idx)
        t_dim.CumulVar(inicio).SetRange(veh.inicio_min, min(veh.inicio_min + ESPERA_MAX_MIN, HORIZONTE_MIN))
        t_dim.SetSpanUpperBoundForVehicle(veh.jornada_max_min, v_idx)
        routing.AddVariableMinimizedByFinalizer(t_dim.CumulVar(inicio))
        routing.AddVariableMinimizedByFinalizer(t_dim.CumulVar(routing.End(v_idx)))

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    # Metaheurística: Búsqueda Tabú (una de las tres que pide la consigna)
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.TABU_SEARCH
    params.time_limit.seconds = max(1, int(limite_segundos))

    solucion = routing.SolveWithParameters(params)
    if solucion is None:
        return Plan(estado="SIN_SOLUCION", no_asignados=[p.id for p in inst.pedidos])

    plan = Plan(estado="FACTIBLE")
    for v_idx, veh in enumerate(inst.vehiculos):
        idx = routing.Start(v_idx)
        paradas: list[ParadaPlan] = []
        km = 0.0
        while not routing.IsEnd(idx):
            siguiente = solucion.Value(routing.NextVar(idx))
            km += dist[manager.IndexToNode(idx)][manager.IndexToNode(siguiente)]
            idx = siguiente
            nodo = manager.IndexToNode(idx)
            if nodo >= offset:
                paradas.append(
                    ParadaPlan(
                        pedido_id=inst.pedidos[nodo - offset].id,
                        orden=len(paradas) + 1,
                        llegada_min=solucion.Min(t_dim.CumulVar(idx)),
                    )
                )
        if not paradas:
            continue
        plan.rutas.append(
            RutaPlan(
                vehiculo_id=veh.id,
                conductor_id=veh.conductor_id,
                paradas=paradas,
                distancia_km=round(km, 3),
                co2_kg=round(km * veh.emision_kg_km, 3),
                inicio_min=solucion.Min(t_dim.CumulVar(routing.Start(v_idx))),
                fin_min=solucion.Min(t_dim.CumulVar(routing.End(v_idx))),
                partida=puntos[inicios[v_idx]] if inicios[v_idx] else None,
            )
        )

    for k, p in enumerate(inst.pedidos):
        idx = manager.NodeToIndex(k + offset)
        if solucion.Value(routing.NextVar(idx)) == idx:
            plan.no_asignados.append(p.id)
    return plan
