[← Volver al README Principal](../../README.md)

# Artefactos Jira - Evidencia de Configuración

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## Configuración Previa Aplicada

Al ser un proyecto individual, el backlog se gestiona en **GitHub Issues** del mismo repositorio, con la misma
estructura que un proyecto Scrum en Jira:

| Concepto en Jira | Equivalente usado |
|---|---|
| Épica | Etiqueta del issue y sección del documento `01 Transformando a ágil` |
| Historia / Enabler | Issue con etiqueta `historia` o `enabler` y etiqueta del RF |
| Sprint | Hito (milestone) `Sprint 1` a `Sprint 5` con su fecha de fin |
| Tablero Scrum | Issues abiertos (por hacer) y cerrados (hechos) de cada hito |
| Release | Versión del repositorio (`v1.0.0`) |

## Evidencia 1: Roadmap del Proyecto

| Sprint | Fechas | Objetivo | Historias |
|---|---|---|---|
| 1 | 02/09/2026 - 15/09/2026 | Base del sistema: autenticación con roles y gestión de flota, conductores y pedidos. | US-001, US-002, US-003, US-004 |
| 2 | 16/09/2026 - 29/09/2026 | Generar rutas optimizadas con el motor VRPTW + Green VRP y verlas en el mapa. | US-005, US-006 |
| 3 | 16/10/2026 - 29/10/2026 | Rutas realistas: jornada del conductor, preferencias del cliente y re-optimización ante incidentes. | US-007, US-008, US-009 |
| 4 | 30/10/2026 - 12/11/2026 | Medir el impacto: dashboard, reporte de sostenibilidad y plan de compensación de carbono. | US-010, US-011, US-012 |
| 5 | 13/11/2026 - 26/11/2026 | Calidad y despliegue: CI/CD, pruebas E2E, prueba de carga, SUS y auditoría Green IT. | ENB-001, ENB-002 |

Hitos en GitHub: https://github.com/FernandoR0/ecologistica/milestones?state=all

## Evidencia 2: Backlog Priorizado

| Prioridad | Issue | ID | Título | Épica | SP | Sprint | Estado |
|:-:|:-:|---|---|---|:-:|---|---|
| 1 | [#1](https://github.com/FernandoR0/ecologistica/issues/1) | US-001 | Iniciar sesión con mi correo y contraseña y ver solo lo que mi rol permite | EP-01 | 5 | Sprint 1 | Cerrado |
| 2 | [#2](https://github.com/FernandoR0/ecologistica/issues/2) | US-002 | Registrar y actualizar los vehículos de la flota | EP-01 | 3 | Sprint 1 | Cerrado |
| 3 | [#3](https://github.com/FernandoR0/ecologistica/issues/3) | US-003 | Registrar conductores y asignarles un vehículo | EP-01 | 3 | Sprint 1 | Cerrado |
| 4 | [#4](https://github.com/FernandoR0/ecologistica/issues/4) | US-004 | Registrar pedidos con ubicación, peso y ventana horaria | EP-01 | 5 | Sprint 1 | Cerrado |
| 5 | [#5](https://github.com/FernandoR0/ecologistica/issues/5) | US-005 | Generar rutas optimizadas con un clic | EP-02 | 13 | Sprint 2 | Cerrado |
| 6 | [#6](https://github.com/FernandoR0/ecologistica/issues/6) | US-006 | Ver las rutas en un mapa con las paradas numeradas | EP-02 | 5 | Sprint 2 | Cerrado |
| 7 | [#7](https://github.com/FernandoR0/ecologistica/issues/7) | US-007 | Que mi ruta no supere mi jornada máxima | EP-02 | 5 | Sprint 3 | Cerrado |
| 8 | [#8](https://github.com/FernandoR0/ecologistica/issues/8) | US-008 | Registrar el horario en que cada cliente prefiere recibir | EP-02 | 5 | Sprint 3 | Cerrado |
| 9 | [#9](https://github.com/FernandoR0/ecologistica/issues/9) | US-009 | Re-optimizar una ruta cuando ocurre un incidente | EP-02 | 8 | Sprint 3 | Cerrado |
| 10 | [#10](https://github.com/FernandoR0/ecologistica/issues/10) | US-010 | Ver un dashboard con los indicadores de la operación | EP-03 | 5 | Sprint 4 | Cerrado |
| 11 | [#11](https://github.com/FernandoR0/ecologistica/issues/11) | US-011 | Ver el reporte de CO₂ emitido, evitado y compensado | EP-03 | 5 | Sprint 4 | Cerrado |
| 12 | [#12](https://github.com/FernandoR0/ecologistica/issues/12) | US-012 | Ver un plan para compensar el CO₂ y registrar lo compensado | EP-03 | 3 | Sprint 4 | Cerrado |
| 13 | [#13](https://github.com/FernandoR0/ecologistica/issues/13) | ENB-001 | CI/CD, Docker y auditoría Green IT | EP-04 | 5 | Sprint 5 | Cerrado |
| 14 | [#14](https://github.com/FernandoR0/ecologistica/issues/14) | ENB-002 | Pruebas E2E, prueba de carga y usabilidad SUS | EP-04 | 5 | Sprint 5 | Abierto |
| 15 | [#15](https://github.com/FernandoR0/ecologistica/issues/15) | US-013 | Descargar un reporte PDF del periodo | EP-03 | 5 | Sprint 5 | Cerrado |
| 16 | [#16](https://github.com/FernandoR0/ecologistica/issues/16) | US-014 | Agregar un pedido nuevo o cancelar uno en una ruta en curso | EP-02 | 5 | Sprint 5 | Cerrado |
| 17 | [#17](https://github.com/FernandoR0/ecologistica/issues/17) | US-015 | Registrar el punto de partida del conductor y los datos de acceso del cliente | EP-01 | 3 | Sprint 5 | Cerrado |
| 18 | [#18](https://github.com/FernandoR0/ecologistica/issues/18) | US-016 | Ajustar los parámetros del motor, gestionar usuarios y revisar la auditoría | EP-04 | 8 | Sprint 5 | Cerrado |
| 19 | [#19](https://github.com/FernandoR0/ecologistica/issues/19) | US-017 | Ver combustible ahorrado, cumplimiento de ventanas y equivalentes ambientales | EP-03 | 3 | Sprint 5 | Cerrado |

Backlog en GitHub: https://github.com/FernandoR0/ecologistica/issues?q=is%3Aissue

## Evidencia 3: Sprint Planning y Sprint Goal

| Sprint | Sprint Goal | SP comprometidos |
|:-:|---|:-:|
| 1 | Base del sistema: autenticación con roles y gestión de flota, conductores y pedidos. | 16 |
| 2 | Generar rutas optimizadas con el motor VRPTW + Green VRP y verlas en el mapa. | 18 |
| 3 | Rutas realistas: jornada del conductor, preferencias del cliente y re-optimización ante incidentes. | 18 |
| 4 | Medir el impacto: dashboard, reporte de sostenibilidad y plan de compensación de carbono. | 13 |
| 5 | Calidad y despliegue: CI/CD, pruebas E2E, prueba de carga, SUS y auditoría Green IT. | 34 |

## Evidencia 4: Tablero Scrum Activo

Estado actual: 18 issues cerrados (hechos) y 1 abierto (ENB-002: falta la encuesta SUS).

## Evidencia 5: Gestión de Versiones / Release

| Versión | Contenido |
|---|---|
| v1.0.0 (PMV) | RF-001 a RF-012, motor VRPTW + Green VRP con Búsqueda Tabú, Inspección 04, SonarQube, pruebas E2E y de carga. Tag y release: https://github.com/FernandoR0/ecologistica/releases/tag/v1.0.0 |

### Capturas

| Evidencia | Captura |
|---|---|
| 1. Roadmap (hitos por sprint) | ![Hitos cerrados](<evidencias/evidencia-1-roadmap-hitos-cerrados.png>) ![Hito abierto](<evidencias/evidencia-1-roadmap-hito-abierto.png>) |
| 2. Backlog priorizado | ![Backlog](<evidencias/evidencia-2-backlog-issues.png>) |
| 3. Sprint Planning (historias de cada sprint) | ![Sprint 1](<evidencias/evidencia-3-sprint-1.png>) ![Sprint 2](<evidencias/evidencia-3-sprint-2.png>) ![Sprint 3](<evidencias/evidencia-3-sprint-3.png>) ![Sprint 4](<evidencias/evidencia-3-sprint-4.png>) ![Sprint 5](<evidencias/evidencia-3-sprint-5.png>) |
| 4. Tablero (hecho / por hacer) | ![Cerrados](<evidencias/evidencia-4-tablero-cerrados.png>) ![Abiertos](<evidencias/evidencia-4-tablero-abiertos.png>) |
| Detalle de una historia | ![US-005](<evidencias/evidencia-issue-us-005.png>) |
| 5. Versiones (commits y GitHub Actions) | ![Commits](<evidencias/evidencia-5-commits.png>) ![Actions](<evidencias/evidencia-5-actions.png>) |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |

[← Volver al README Principal](../../README.md)
