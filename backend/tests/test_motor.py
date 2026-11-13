"""Pruebas unitarias del motor VRPTW + Green VRP (sin BD)."""

import pytest

from app.optimization.emisiones import co2_kg, emision_kg_por_km
from app.optimization.geo import haversine_km, hora_a_min, min_a_hora
from app.optimization.vrptw import Instancia, PedidoNodo, VehiculoRecurso, resolver

DEPOSITO = (-12.0651, -75.2049)


def pedido(i, lat, lng, peso=50, ini="08:00", fin="18:00", prioridad=2):
    return PedidoNodo(i, lat, lng, peso, hora_a_min(ini), hora_a_min(fin), 10, prioridad)


def vehiculo(i, cap=1000, emision=0.3):
    return VehiculoRecurso(i, cap, emision)


def test_haversine_huancayo_el_tambo():
    assert 1.0 < haversine_km(*DEPOSITO, -12.0560, -75.2160) < 2.0


def test_conversion_horas():
    assert hora_a_min("08:30") == 510
    assert min_a_hora(510) == "08:30"


def test_emisiones_diesel_vs_electrico():
    assert emision_kg_por_km("DIESEL", 10) == pytest.approx(0.268)
    assert co2_kg(100, "ELECTRICO", 18) < co2_kg(100, "DIESEL", 10)
    with pytest.raises(ValueError):
        emision_kg_por_km("CARBON", 10)


def test_sin_pedidos():
    assert resolver(Instancia(DEPOSITO, [], [vehiculo(1)])).estado == "SIN_PEDIDOS"


def test_atiende_todos_los_pedidos_factibles():
    pedidos = [pedido(i, -12.06 - i * 0.003, -75.21 + i * 0.002) for i in range(1, 8)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1), vehiculo(2)]), 1)
    servidos = sorted(p.pedido_id for r in plan.rutas for p in r.paradas)
    assert plan.estado == "FACTIBLE"
    assert servidos == list(range(1, 8))
    assert plan.no_asignados == []


def test_respeta_capacidad():
    pedidos = [pedido(i, -12.06 - i * 0.002, -75.20, peso=300) for i in range(1, 5)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, cap=600), vehiculo(2, cap=600)]), 1)
    for ruta in plan.rutas:
        carga = sum(next(p.peso_kg for p in pedidos if p.id == s.pedido_id) for s in ruta.paradas)
        assert carga <= 600
    assert len(plan.rutas) == 2


def test_respeta_ventanas_horarias():
    pedidos = [
        pedido(1, -12.07, -75.21, ini="10:00", fin="10:30"),
        pedido(2, -12.05, -75.20, ini="08:00", fin="09:00"),
    ]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1)]), 1)
    llegadas = {s.pedido_id: s.llegada_min for r in plan.rutas for s in r.paradas}
    assert hora_a_min("10:00") <= llegadas[1] <= hora_a_min("10:30")
    assert hora_a_min("08:00") <= llegadas[2] <= hora_a_min("09:00")
    # Debe visitar primero el pedido de la ventana temprana
    assert plan.rutas[0].paradas[0].pedido_id == 2


def test_descarta_pedido_imposible_sin_romper_plan():
    pedidos = [pedido(1, -12.07, -75.21), pedido(2, -12.07, -75.22, peso=5000)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, cap=1000)]), 1)
    assert plan.no_asignados == [2]
    assert [s.pedido_id for s in plan.rutas[0].paradas] == [1]


def test_green_vrp_prefiere_vehiculo_menos_contaminante():
    pedidos = [pedido(i, -12.07 - i * 0.002, -75.21) for i in range(1, 4)]
    vehs = [vehiculo(1, emision=0.30), vehiculo(2, emision=0.04)]
    plan = resolver(Instancia(DEPOSITO, pedidos, vehs, peso_co2=2.0), 1)
    assert [r.vehiculo_id for r in plan.rutas] == [2]


def test_jornada_maxima_del_conductor():
    lejos = [pedido(i, -12.30, -75.45 + i * 0.01) for i in range(1, 4)]  # ~40 km
    corta = VehiculoRecurso(1, 1000, 0.3, inicio_min=480, jornada_max_min=60)
    plan = resolver(Instancia(DEPOSITO, lejos, [corta]), 1)
    assert sorted(plan.no_asignados) == [1, 2, 3]


def test_reoptimizacion_desde_origen():
    pedidos = [pedido(1, -12.08, -75.20), pedido(2, -12.09, -75.21)]
    inst = Instancia(DEPOSITO, pedidos, [VehiculoRecurso(1, 1000, 0.3, inicio_min=600)], origen=(-12.085, -75.205))
    plan = resolver(inst, 1)
    assert plan.rutas[0].inicio_min >= 600
    assert len(plan.rutas[0].paradas) == 2
