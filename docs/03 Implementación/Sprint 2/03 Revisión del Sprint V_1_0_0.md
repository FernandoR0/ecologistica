[← Volver al README Principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

## Historias de Usuario completadas en este Sprint

| Código | Título | Criterios de aceptación verificados | Pull Request / commit de cierre | Estado |
|---|---|---|---|---|
| US-006 | Generar rutas optimizadas | Plan factible con capacidad y jornada; ahorro de km y CO₂ frente a la ruta secuencial; pedidos que no caben se informan como no asignados. | [3b1724c](https://github.com/FernandoR0/ecologistica/commit/3b1724c) · [a4f1363 (no asignados)](https://github.com/FernandoR0/ecologistica/commit/a4f1363) | Done |
| US-007 | Ver las rutas en el mapa | Cada ruta con su color y paradas numeradas sobre OpenStreetMap con su hora estimada. | [c0ec63b](https://github.com/FernandoR0/ecologistica/commit/c0ec63b) · [12998a6 (mosaicos OSM)](https://github.com/FernandoR0/ecologistica/commit/12998a6) | Done |
| ENB-002 | Prueba de rendimiento del motor | Script `backend/scripts/prueba_carga.py`: 150 pedidos y 15 vehículos resueltos en 30 s (meta ≤ 45 s). | [555a49f](https://github.com/FernandoR0/ecologistica/commit/555a49f) | Done |

## Demostración del trabajo completado

Demostración a los stakeholders de las funcionalidades implementadas.

- Entorno: ejecución local con datos de demostración de Huancayo, El Tambo y Chilca.
- Se generó el plan para los pedidos pendientes con un clic, se revisó el mapa con las rutas y el ahorro frente a la ruta secuencial, y se ejecutó la prueba de carga de 150 pedidos y 15 vehículos.
- Evidencias: ![Rutas generadas](<../../06 Anexos/evidencias/e2e-07-rutas-generadas.png>)
- Pruebas automáticas: `backend/tests/test_motor.py` (capacidad, ventanas, Green VRP, jornada) y la prueba de carga.

## Pendientes

- La coloración de cada tramo por congestión, el tiempo por tramo y las capas de distritos y zonas del mapa se completaron en el Sprint 4 (commits [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) y [80e4054](https://github.com/FernandoR0/ecologistica/commit/80e4054)).

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 29/09/2026 | Fernando Rodrigo Chaupis Espinoza | Revisión del sprint |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Plantilla oficial de la consigna, enlaces a commits, enlace de retorno al README y nota de los campos completados en el Sprint 4 |

[← Volver al README Principal](../../../README.md)
