# Informe de estado del proyecto - Sprint 1

| Campo | Valor |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla |
| Organización | DistriRápido S.A.C., Huancayo, Junín |
| Curso | Taller de Proyectos 2, Universidad Continental |
| Versión | 1.0.0 |
| Fecha | 13/11/2026 |
| Elaborado por | Fernando Rodrigo Chaupis Espinoza |
| Revisado por | Docente: Daniel Gamarra Moreno |

---

**Sprint 1:** 02/09/2026 – 15/09/2026
**Sprint Goal:** Base del sistema: autenticación con roles y CRUD de flota, conductores y pedidos.

## 1. Resumen del estado
| Aspecto | Estado (🟢/🟡/🔴) | Comentario |
|---|:-:|---|
| Alcance | 🟢 | Historias completadas (issues #1 a #4 cerrados) |
| Cronograma | _Completar_ | |
| Calidad | 🟢 | 27 pruebas de backend, 5 de frontend y 4 E2E en verde; cobertura backend 90 % |
| Riesgos | 🟢 | Ver `04 Seguimiento y Control/03 Seguimiento de riesgos` |

## 2. Historias comprometidas
| ID | Historia / Enabler | Requisito | SP | Sprint |
|---|---|---|:-:|:-:|
| US-001 | Inicio de sesión y control de acceso por roles | RNF-SEG | 5 | 1 |
| US-002 | Gestión de flota vehicular | RF-001 | 3 | 1 |
| US-003 | Gestión de conductores y asignación de vehículo | RF-008 | 3 | 1 |
| US-004 | Registro y gestión de pedidos con ventana horaria | RF-002 | 5 | 1 |

## 3. Avance
| Métrica | Valor |
|---|---|
| SP comprometidos | 16 |
| SP completados | 16 |
| Pruebas automatizadas en verde | test_auth.py (7), test_crud_vehiculo_y_duplicado, test_validacion_pedido |

## 4. Próximos pasos
Sprint 2: motor VRPTW + Green VRP y mapa de rutas.
