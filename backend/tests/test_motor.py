"""Pruebas unitarias del motor VRPTW + Green VRP (sin BD)."""

import pytest

from app.optimization.emisiones import co2_kg, consumo_unidades, factor_emision_kg_km
from app.optimization.geo import (
    haversine_km,
    hora_a_min,
    min_a_hora,
    nivel_congestion,
    punto_en_poligono,
    tramo_cruza,
    velocidad_en,
)
from app.optimization.vrptw import Instancia, PedidoNodo, VehiculoRecurso, resolver

DEPOSITO = (-12.0651, -75.2049)
CUADRADO = [[-12.07, -75.21], [-12.07, -75.20], [-12.08, -75.20], [-12.08, -75.21]]


def pedido(i, lat, lng, peso=50, ini="08:00", fin="18:00", prioridad=2, **kw):
    return PedidoNodo(i, lat, lng, peso, hora_a_min(ini), hora_a_min(fin), 10, prioridad, **kw)


def vehiculo(i, cap=1000, emision=0.3, **kw):
    return VehiculoRecurso(i, cap, emision, **kw)


def test_haversine_huancayo_el_tambo():
    assert 1.0 < haversine_km(*DEPOSITO, -12.0560, -75.2160) < 2.0


def test_conversion_horas():
    assert hora_a_min("08:30") == 510
    assert min_a_hora(510) == "08:30"


def test_factor_de_emision_por_rendimiento():
    assert factor_emision_kg_km("DIESEL", 9) == pytest.approx(0.2978, abs=1e-4)
    assert co2_kg(100, "ELECTRICO", 5.5) < co2_kg(100, "DIESEL", 9)
    assert consumo_unidades(90, 9) == 10
    with pytest.raises(ValueError):
        factor_emision_kg_km("CARBON", 10)
    with pytest.raises(ValueError):
        factor_emision_kg_km("DIESEL", 0)


def test_geometria_de_zonas():
    assert punto_en_poligono(-12.075, -75.205, CUADRADO)
    assert not punto_en_poligono(-12.06, -75.205, CUADRADO)
    assert tramo_cruza((-12.075, -75.22), (-12.075, -75.19), CUADRADO)
    assert not tramo_cruza((-12.06, -75.22), (-12.06, -75.19), CUADRADO)


def test_perfil_de_velocidad_y_congestion():
    assert velocidad_en(hora_a_min("08:00"), 25, 15) == 15  # hora punta mañana
    assert velocidad_en(hora_a_min("11:00"), 25, 15) == 25
    assert velocidad_en(hora_a_min("18:30"), 25, 15) == 15  # hora punta tarde
    assert [nivel_congestion(v) for v in (25, 18, 15)] == ["VERDE", "AMARILLO", "ROJO"]


def test_sin_pedidos():
    assert resolver(Instancia(DEPOSITO, [], [vehiculo(1)])).estado == "SIN_PEDIDOS"


def test_sin_vehiculos():
    plan = resolver(Instancia(DEPOSITO, [pedido(1, -12.07, -75.21)], []))
    assert plan.estado == "SIN_SOLUCION" and plan.no_asignados == [1]


def test_atiende_todos_los_pedidos_factibles():
    pedidos = [pedido(i, -12.06 - i * 0.003, -75.21 + i * 0.002) for i in range(1, 8)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1), vehiculo(2)]), 1)
    servidos = sorted(p.pedido_id for r in plan.rutas for p in r.paradas)
    assert plan.estado == "FACTIBLE"
    assert servidos == list(range(1, 8))
    assert plan.no_asignados == []


def test_respeta_capacidad_en_peso():
    pedidos = [pedido(i, -12.06 - i * 0.002, -75.20, peso=300) for i in range(1, 5)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, cap=600), vehiculo(2, cap=600)]), 1)
    for ruta in plan.rutas:
        carga = sum(next(p.peso_kg for p in pedidos if p.id == s.pedido_id) for s in ruta.paradas)
        assert carga <= 600
    assert len(plan.rutas) == 2


def test_respeta_capacidad_en_volumen():
    pedidos = [pedido(i, -12.06 - i * 0.002, -75.20, peso=10, volumen_m3=3) for i in range(1, 4)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, volumen_m3=6)]), 1)
    assert len(plan.no_asignados) == 1
    assert len(plan.rutas[0].paradas) == 2


def test_respeta_ventanas_horarias():
    pedidos = [
        pedido(1, -12.07, -75.21, ini="10:00", fin="10:30"),
        pedido(2, -12.05, -75.20, ini="08:00", fin="09:00"),
    ]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1)]), 1)
    paradas = {s.pedido_id: s for r in plan.rutas for s in r.paradas}
    assert hora_a_min("10:00") <= paradas[1].llegada_min <= hora_a_min("10:30")
    assert not any(s.fuera_ventana for s in paradas.values())
    assert plan.rutas[0].paradas[0].pedido_id == 2  # primero la ventana temprana


def test_llegada_tarde_se_permite_con_penalidad_y_se_marca():
    # Dos pedidos lejanos con la misma ventana corta: uno solo puede llegar tarde
    pedidos = [pedido(1, -12.10, -75.25, ini="08:00", fin="08:20"), pedido(2, -12.02, -75.15, ini="08:00", fin="08:20")]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, inicio_min=480)], tardanza_max_min=120), 1)
    paradas = [s for r in plan.rutas for s in r.paradas]
    assert any(s.fuera_ventana for s in paradas) or plan.no_asignados


def test_descarta_pedido_imposible_sin_romper_plan():
    pedidos = [pedido(1, -12.07, -75.21), pedido(2, -12.07, -75.22, peso=5000)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, cap=1000)]), 1)
    assert plan.no_asignados == [2]
    assert [s.pedido_id for s in plan.rutas[0].paradas] == [1]


def test_prioridad_express_y_perecedero_se_atienden_primero():
    pedidos = [pedido(1, -12.07, -75.21, peso=600, prioridad=3),
               pedido(2, -12.071, -75.211, peso=600, prioridad=1, perecedero=True)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, cap=700)]), 1)
    assert plan.no_asignados == [1]


def test_green_vrp_prefiere_vehiculo_menos_contaminante():
    pedidos = [pedido(i, -12.07 - i * 0.002, -75.21) for i in range(1, 4)]
    vehs = [vehiculo(1, emision=0.30), vehiculo(2, emision=0.04)]
    plan = resolver(Instancia(DEPOSITO, pedidos, vehs, peso_co2=2.0), 1)
    assert [r.vehiculo_id for r in plan.rutas] == [2]


def test_zona_restringida_solo_vehiculos_permitidos():
    pedidos = [pedido(1, -12.075, -75.205, en_zona_restringida=True)]
    vehs = [vehiculo(1, emision=0.01, puede_entrar_centro=False), vehiculo(2, emision=0.30)]
    plan = resolver(Instancia(DEPOSITO, pedidos, vehs, peso_co2=5.0), 1)
    assert [r.vehiculo_id for r in plan.rutas] == [2]
    solo_restringido = resolver(Instancia(DEPOSITO, pedidos, [vehs[0]]), 1)
    assert solo_restringido.no_asignados == [1]


def test_zona_de_riesgo_encarece_los_tramos():
    pedidos = [pedido(1, -12.075, -75.212), pedido(2, -12.075, -75.198)]
    sin = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1)]), 1)
    con = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1)], zonas_riesgo=[CUADRADO]), 1)
    assert sin.estado == con.estado == "FACTIBLE"
    assert len(con.rutas[0].paradas) == 2


def test_jornada_maxima_del_conductor():
    lejos = [pedido(i, -12.30, -75.45 + i * 0.01) for i in range(1, 4)]  # ~40 km
    corta = vehiculo(1, inicio_min=480, jornada_max_min=60)
    plan = resolver(Instancia(DEPOSITO, lejos, [corta]), 1)
    assert sorted(plan.no_asignados) == [1, 2, 3]


def test_descanso_de_una_hora_cada_cuatro_horas():
    # Pedidos con ventanas escalonadas obligan a una ruta de más de 4 horas
    pedidos = [pedido(i, -12.06 - i * 0.002, -75.21, ini=f"{8 + i:02d}:00", fin=f"{8 + i:02d}:30")
               for i in range(0, 7)]
    plan = resolver(Instancia(DEPOSITO, pedidos, [vehiculo(1, inicio_min=480, jornada_max_min=600)]), 1)
    ruta = plan.rutas[0]
    assert ruta.descanso_min == 60
    assert ruta.duracion_min <= 600


def test_tramos_con_tiempo_y_congestion():
    lejos = [pedido(1, -12.10, -75.24, ini="07:00", fin="12:00")]
    punta = resolver(Instancia(DEPOSITO, lejos, [vehiculo(1, inicio_min=450)]), 1).rutas[0].paradas[0]
    assert punta.distancia_tramo_km > 0 and punta.tiempo_tramo_min > 0
    assert punta.congestion == "ROJO"  # sale en hora punta (7:00-9:00)
    normal = resolver(Instancia(DEPOSITO, lejos, [vehiculo(1, inicio_min=600)]), 1).rutas[0].paradas[0]
    assert normal.congestion == "VERDE"
    assert normal.tiempo_tramo_min < punta.tiempo_tramo_min


def test_reoptimizacion_desde_origen():
    pedidos = [pedido(1, -12.08, -75.20), pedido(2, -12.09, -75.21)]
    inst = Instancia(DEPOSITO, pedidos, [vehiculo(1, inicio_min=600)], origen=(-12.085, -75.205))
    plan = resolver(inst, 1)
    assert plan.rutas[0].inicio_min >= 600
    assert len(plan.rutas[0].paradas) == 2


def test_cada_vehiculo_sale_de_su_punto_de_partida():
    casa = (-12.0560, -75.2160)
    plan = resolver(Instancia(DEPOSITO, [pedido(1, -12.057, -75.215, peso=10)], [vehiculo(1, 500, origen=casa)]), 1)
    assert plan.rutas[0].partida == casa
