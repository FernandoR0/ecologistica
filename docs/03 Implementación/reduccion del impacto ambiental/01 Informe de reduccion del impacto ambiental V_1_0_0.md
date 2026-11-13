# Informe de reducción del impacto ambiental

| Campo | Valor |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla |
| Organización | DistriRápido S.A.C., Huancayo, Junín |
| Curso | Taller de Proyectos 2, Universidad Continental |
| Versión | 1.0.0 |
| Fecha | _Completar_ |
| Elaborado por | _Completar_ |
| Revisado por | Docente: Daniel Gamarra Moreno |

---

## 1. Impacto del producto (logística verde)
El objetivo del motor es **minimizar distancia × (1 + peso_CO₂ × emisión relativa del vehículo)**. Así se
reducen kilómetros y además se prefieren los vehículos menos contaminantes.

| Indicador | Ruta sin optimizar (línea base) | Ruta optimizada | Reducción |
|---|---|---|---|
| km (datos demo: 20 pedidos, 3 vehículos) | _Completar_ | _Completar_ | _Completar_ |
| kg CO₂ | _Completar_ | _Completar_ | _Completar_ |

> La línea base es el mismo conjunto de paradas recorrido en orden de registro. Se obtiene en
> `GET /api/indicadores` (`ahorro_km`, `ahorro_co2_kg`).

### Factores de emisión utilizados
| Combustible | Factor | Fuente |
|---|---|---|
| Diésel | 2.68 kg CO₂/L | IPCC 2006, _Completar_ citar |
| Gasolina | 2.31 kg CO₂/L | IPCC 2006 |
| GLP | 1.51 kg CO₂/L | IPCC 2006 |
| Electricidad (SEIN) | 0.20 kg CO₂/kWh | MINAM / COES, _Completar_ citar año |

## 2. Impacto del software (Green IT)
| Práctica | Implementación |
|---|---|
| Carga diferida | El módulo de mapa (Leaflet) se descarga solo al abrir "Rutas" |
| Menos datos transferidos | API JSON compacta; sin imágenes pesadas |
| Cómputo acotado | El solver tiene límite de tiempo configurable (`SOLVER_TIME_LIMIT_S`) |
| Infraestructura | Contenedores ligeros (`python:3.12-slim`, `postgres:16-alpine`) |

## 3. Medición
Ejecutar Lighthouse y el *Website Carbon Calculator* sobre staging y registrar gramos de CO₂ por visita: _Completar_.
