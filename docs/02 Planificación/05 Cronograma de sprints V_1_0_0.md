# Cronograma de Sprints

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## 1. Calendario vigente

Calendario del curso Taller de Proyectos 2 (2026-II). Cada sprint dura 2 semanas calendario. Entre el 30/09 y el
15/10 no hay sprint; el Sprint 3 arranca el 16/10/2026.

| Sprint | Inicio | Fin | Hito del curso | Objetivo | Historias | SP |
|:-:|---|---|---|---|---|:-:|
| 1 | 02/09/2026 | 15/09/2026 | Hito 1 | Base del sistema: autenticación con roles y gestión de flota, conductores y pedidos. | US-001, US-002, US-003, US-004 | 16 |
| 2 | 16/09/2026 | 29/09/2026 | Hito 2 | Generar rutas optimizadas con el motor VRPTW + Green VRP y verlas en el mapa. | US-005, US-006 | 18 |
| 3 | 16/10/2026 | 29/10/2026 | - | Rutas realistas: jornada del conductor, preferencias del cliente y re-optimización ante incidentes. | US-007, US-008, US-009 | 18 |
| 4 | 30/10/2026 | 12/11/2026 | Hito 3 | Medir el impacto: dashboard, reporte de sostenibilidad y plan de compensación de carbono. | US-010, US-011, US-012 | 13 |
| 5 | 13/11/2026 | 26/11/2026 | Inspección 04 | Calidad y despliegue: CI/CD, pruebas E2E, prueba de carga, SUS y auditoría Green IT. | ENB-001, ENB-002 | 10 |
| Cierre | 27/11/2026 | 13/12/2026 | Hito 4 (entrega final) | Documentos de cierre y sustentación | - | - |

```
02/09          16/09          16/10          30/10          13/11          27/11      13/12
 |---- S1 ----| |---- S2 ----| … |---- S3 ----| |---- S4 ----| |---- S5 ----| |-- Cierre --|
 Hito 1         Hito 2                            Hito 3                                 Hito 4
```

## 2. Actividades por sprint

| Sprint | Actividad | ID | SP |
|:-:|---|---|:-:|
| 1 | Iniciar sesión con mi correo y contraseña y ver solo lo que mi rol permite | US-001 | 5 |
| 1 | Registrar y actualizar los vehículos de la flota | US-002 | 3 |
| 1 | Registrar conductores y asignarles un vehículo | US-003 | 3 |
| 1 | Registrar pedidos con ubicación, peso y ventana horaria | US-004 | 5 |
| 2 | Generar rutas optimizadas con un clic | US-005 | 13 |
| 2 | Ver las rutas en un mapa con las paradas numeradas | US-006 | 5 |
| 3 | Que mi ruta no supere mi jornada máxima | US-007 | 5 |
| 3 | Registrar el horario en que cada cliente prefiere recibir | US-008 | 5 |
| 3 | Re-optimizar una ruta cuando ocurre un incidente | US-009 | 8 |
| 4 | Ver un dashboard con los indicadores de la operación | US-010 | 5 |
| 4 | Ver el reporte de CO₂ emitido, evitado y compensado | US-011 | 5 |
| 4 | Ver un plan para compensar el CO₂ y registrar lo compensado | US-012 | 3 |
| 5 | CI/CD, Docker y auditoría Green IT | ENB-001 | 5 |
| 5 | Pruebas E2E, prueba de carga y usabilidad SUS | ENB-002 | 5 |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
