"""Prueba de carga del motor de rutas (RNF-01): 150 pedidos y 15 vehículos en Huancayo.

Uso (desde backend/):  python -m scripts.prueba_carga [segundos_limite] [repeticiones]
Imprime el tiempo de cada corrida, el P95 y cuántos pedidos quedaron sin asignar.
"""

import json
import random
import statistics
import sys
import time

from app.optimization.geo import hora_a_min
from app.optimization.vrptw import Instancia, PedidoNodo, VehiculoRecurso, resolver

DEPOSITO = (-12.0651, -75.2049)


def instancia(semilla: int) -> Instancia:
    rnd = random.Random(semilla)  # noqa: S311 - datos de prueba
    ventanas = [("08:00", "12:00"), ("09:00", "13:00"), ("10:00", "16:00"), ("13:00", "18:00"), ("08:00", "18:00")]
    pedidos = []
    for i in range(150):
        ini, fin = rnd.choice(ventanas)
        pedidos.append(PedidoNodo(
            id=i + 1, lat=DEPOSITO[0] + rnd.uniform(-0.035, 0.035), lng=DEPOSITO[1] + rnd.uniform(-0.035, 0.035),
            peso_kg=rnd.choice([20, 40, 60, 80, 120]), ventana_inicio=hora_a_min(ini), ventana_fin=hora_a_min(fin),
            servicio_min=10, prioridad=rnd.choice([1, 2, 2, 3]),
        ))
    emisiones = [0.298, 0.201, 0.036]  # diésel 9 km/L, GLP 7,5 km/L, eléctrico 5,5 km/kWh
    vehiculos = [VehiculoRecurso(id=k + 1, capacidad_kg=rnd.choice([600, 1000, 1500]), emision_kg_km=emisiones[k % 3])
                 for k in range(15)]
    return Instancia(DEPOSITO, pedidos, vehiculos)


def main() -> None:
    limite = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    repeticiones = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    tiempos, sin_asignar, km = [], [], []
    for r in range(repeticiones):
        t0 = time.perf_counter()
        plan = resolver(instancia(r), limite)
        tiempos.append(time.perf_counter() - t0)
        sin_asignar.append(len(plan.no_asignados))
        km.append(plan.distancia_total_km)
        print(f"corrida {r + 1}: {tiempos[-1]:.1f} s · {len(plan.rutas)} rutas · {plan.distancia_total_km:.1f} km · "
              f"{plan.co2_total_kg:.2f} kg CO2 · sin asignar {len(plan.no_asignados)}")
    p95 = sorted(tiempos)[max(0, round(0.95 * len(tiempos)) - 1)]
    print(json.dumps({"pedidos": 150, "vehiculos": 15, "limite_s": limite, "repeticiones": repeticiones,
                      "promedio_s": round(statistics.mean(tiempos), 1), "p95_s": round(p95, 1),
                      "max_sin_asignar": max(sin_asignar), "km_promedio": round(statistics.mean(km), 1)}))


if __name__ == "__main__":
    main()
