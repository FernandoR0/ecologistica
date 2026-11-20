[← Volver al README Principal](../../README.md)

# Presupuesto del Proyecto

| Metadato | Valor |
|---|---|
| Nombre del Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. |
| Líder del Proyecto | Fernando Rodrigo Chaupis Espinoza |
| Moneda | Dólares estadounidenses (USD); tipo de cambio de referencia S/ 3,70 por USD |
| Periodo | 02/09/2026 - 04/12/2026 (14 semanas) |
| Fecha | 19/11/2026 |
| Versión | 1.1.0 |

---
## 1. Costo de Recursos Humanos (CAPEX)

Una sola persona cumple todos los roles; las horas se asignan por rol para valorar el trabajo con la tarifa de mercado
peruana de cada perfil (S/ 25 a S/ 50 por hora según el caso, convertidas a USD).

| Rol | Actividades principales | Horas asignadas | Tarifa hora (USD) | Costo (USD) |
|---|---|:-:|:-:|--:|
| Project Manager | Acta, planificación, Jira, riesgos, reportes de estado y cierre | 40 | 13,00 | 520,00 |
| Software Architect | Stack, modelo C4, base de datos, decisiones del motor | 40 | 13,00 | 520,00 |
| Senior Developer | Motor VRPTW + Green VRP, backend FastAPI, seguridad | 120 | 12,00 | 1 440,00 |
| Junior Developer | Frontend React, mapa, pantallas de gestión | 100 | 8,00 | 800,00 |
| QA Engineer | Pruebas unitarias, E2E con Playwright, SUS, SonarQube | 40 | 9,00 | 360,00 |
| UI/UX Designer | Prototipos, accesibilidad WCAG, modo conductor | 20 | 9,00 | 180,00 |
| **Total RR. HH.** | | **360** | | **3 820,00** |

Cálculo: Costo = Horas asignadas × Tarifa hora.

## 2. Costo de Licenciamiento y Herramientas

| Herramienta | Uso | Plan | Costo (USD) |
|---|---|---|--:|
| Visual Studio Code | Entorno de desarrollo | Libre | 0,00 |
| Atlassian Jira Software | Backlog, sprints, roadmap, releases | Free (hasta 10 usuarios) | 0,00 |
| GitHub | Repositorio, Actions, Codespaces | Free | 0,00 |
| SonarQube Cloud | Calidad y seguridad del código | Free para repositorios públicos | 0,00 |
| Figma | Prototipos de interfaz | Starter (gratuito) | 0,00 |
| Google OR-Tools, FastAPI, React, PostgreSQL, Leaflet, Playwright | Construcción y pruebas | Código abierto | 0,00 |
| **Total licencias** | | | **0,00** |

## 3. Costo de Infraestructura Cloud y Servicios (OPEX)

Se presupuesta el entorno de producción con planes pagados mínimos para garantizar la disponibilidad durante 4 meses
de operación del MVP.

| Servicio | Detalle | Costo mensual (USD) | Meses | Costo (USD) |
|---|---|:-:|:-:|--:|
| Render Web Service (Starter) | API FastAPI en contenedor | 7,00 | 4 | 28,00 |
| Render PostgreSQL (Basic 256 MB) | Base de datos de producción | 6,00 | 4 | 24,00 |
| Vercel (Hobby) | Frontend estático con CDN y HTTPS | 0,00 | 4 | 0,00 |
| Dominio `.com` | Nombre de dominio por un año (certificado SSL incluido en el proveedor) | - | - | 12,00 |
| GitHub Actions | CI/CD (2 000 min/mes incluidos) | 0,00 | 4 | 0,00 |
| Internet y energía del puesto de desarrollo | Prorrateo para el proyecto | 30,00 | 4 | 120,00 |
| **Total OPEX** | | | | **184,00** |

## 4. Reserva de Contingencia (Imprevistos)

Se reserva el **12 %** del subtotal, dentro del rango sugerido de 10 % a 15 %, por la exposición de los riesgos High
del registro de riesgos (RSK-01 rendimiento del motor y RSK-03 capacidad de un solo integrante), que podrían requerir
cerca de 40 horas adicionales de desarrollo (40 h × USD 12 = USD 480).

Cálculo: 4 004,00 × 0,12 = **USD 480,48**.

## 5. Tabla Resumen Financiera

| Categoría | Costo Subtotal (USD) | Porcentaje del Total |
|---|--:|--:|
| 1. Recursos Humanos (CAPEX) | $ 3 820,00 | 95,4 % |
| 2. Licenciamiento de Software | $ 0,00 | 0,0 % |
| 3. Infraestructura Cloud (OPEX) | $ 184,00 | 4,6 % |
| **SUBTOTAL DE PROYECTO** | **$ 4 004,00** | **100,0 %** |
| 4. Reserva de Contingencia (12 %) | $ 480,48 | N/A |
| **PRESUPUESTO TOTAL ESTIMADO** | **$ 4 484,48** | **100,0 %** |

Equivalente en soles: S/ 16 592,58 (a S/ 3,70 por USD).

## 6. Distribución del presupuesto por sprint (línea base para el valor ganado)

| Periodo | Horas | Costo RR. HH. (USD) | OPEX (USD) | Valor planificado acumulado (USD) |
|---|:-:|--:|--:|--:|
| Inicio y planificación (02/09 - 15/09) | 60 | 680,00 | 12,00 | 692,00 |
| Sprint 1 (02/09 - 15/09, en paralelo) | 60 | 620,00 | 0,00 | 1 312,00 |
| Sprint 2 (16/09 - 29/09) | 70 | 760,00 | 46,00 | 2 118,00 |
| Sprint 3 (16/10 - 29/10) | 70 | 740,00 | 46,00 | 2 904,00 |
| Sprint 4 (30/10 - 19/11) | 80 | 840,00 | 46,00 | 3 790,00 |
| Cierre (20/11 - 04/12) | 20 | 180,00 | 34,00 | 4 004,00 |
| **Total (BAC sin reserva)** | **360** | **3 820,00** | **184,00** | **4 004,00** |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 15/09/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial en USD con CAPEX, licencias, OPEX y contingencia del 12 % |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Cambio de alcance del Sprint 4 (enunciado oficial del caso): reserva de contingencia y distribución por sprint como línea base del valor ganado |

[← Volver al README Principal](../../README.md)
