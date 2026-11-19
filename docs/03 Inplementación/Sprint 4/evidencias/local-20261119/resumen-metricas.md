[← Volver al README Principal](../../../../../README.md)

## Resultados de Playwright

| Navegador | Aprobadas | Total | Éxito |
|---|---:|---:|---:|
| chromium | 25 | 25 | 100.0 % |
| firefox | 25 | 25 | 100.0 % |
| webkit | 25 | 25 | 100.0 % |

| Navegador | TTFB (ms) | FCP (ms) | LCP (ms) | Bytes transferidos |
|---|---:|---:|---:|---:|
| chromium | 5 | 192 | 192 | 79288 |
| firefox | 14 | 214 | 252 | 79288 |
| webkit | 9 | 193 | no soportado | 79288 |

| Navegador | Endpoint | Tiempo (ms) |
|---|---|---:|
| chromium | GET /api/pedidos | 27 |
| chromium | GET /api/vehiculos | 37 |
| chromium | GET /api/conductores | 37 |
| chromium | GET /api/clientes | 31 |
| chromium | GET /api/indicadores | 27 |
| firefox | GET /api/pedidos | 54 |
| firefox | GET /api/vehiculos | 20 |
| firefox | GET /api/conductores | 29 |
| firefox | GET /api/clientes | 24 |
| firefox | GET /api/indicadores | 23 |
| webkit | GET /api/pedidos | 31 |
| webkit | GET /api/vehiculos | 20 |
| webkit | GET /api/conductores | 43 |
| webkit | GET /api/clientes | 16 |
| webkit | GET /api/indicadores | 10 |

| Navegador | Destino | Disponibilidad | p50 (ms) | p95 (ms) |
|---|---|---:|---:|---:|
| chromium | Interfaz (/login) | 10/10 | 8 | 11 |
| chromium | API (/api/health) | 10/10 | 14 | 19 |
| firefox | Interfaz (/login) | 10/10 | 10 | 21 |
| firefox | API (/api/health) | 10/10 | 11 | 15 |
| webkit | Interfaz (/login) | 10/10 | 10 | 20 |
| webkit | API (/api/health) | 10/10 | 13 | 18 |

[← Volver al README Principal](../../../../../README.md)
