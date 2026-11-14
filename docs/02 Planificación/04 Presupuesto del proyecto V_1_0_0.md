# Presupuesto del Proyecto

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## 1. Costo de Recursos Humanos (CAPEX)

Proyecto individual: una sola persona cumple los tres roles. Las horas son la estimación de esfuerzo del semestre.

| Rol | Personas | Horas | Tarifa (S/ / h) | Subtotal (S/) |
|---|:-:|:-:|:-:|:-:|
| Product Owner | 1 | 40 | 25 | 1 000 |
| Scrum Master | 1 | 30 | 25 | 750 |
| Developer | 1 | 230 | 20 | 4 600 |
| **Total** | | **300** | | **6 350** |

## 2. Costo de Licenciamiento y Herramientas

| Herramienta | Licencia | Costo (S/) |
|---|---|:-:|
| Python, FastAPI, OR-Tools, PostgreSQL, React, Leaflet | Libre | 0 |
| GitHub (repositorio público, Actions, Issues) | Gratuita | 0 |
| SonarQube Cloud | Gratuita para repositorios públicos | 0 |
| Laptop (S/ 3 600 en 36 meses, 4 meses de uso) | Depreciación | 400 |
| **Total** | | **400** |

## 3. Costo de Infraestructura Cloud y Servicios (OPEX)

| Servicio | Uso | Costo (S/) |
|---|---|:-:|
| Ejecución con Docker Compose | Demostración local | 0 |
| GitHub Actions | CI, auditoría Green IT y SonarQube Cloud | 0 |
| Teselas de OpenStreetMap | Mapa | 0 |
| **Total** | | **0** |

## 4. Tabla Resumen Financiera

| Concepto | Monto (S/) | % |
|---|:-:|:-:|
| Recursos humanos | 6 350 | 85.5 % |
| Licencias y herramientas | 400 | 5.4 % |
| Infraestructura y servicios | 0 | 0 % |
| Reserva de contingencia (10 %) | 675 | 9.1 % |
| **Total** | **7 425** | **100 %** |

## 5. Justificación de la Reserva de Contingencia

Se reserva el 10 % de la línea base (S/ 675) para riesgos con exposición media o alta (R-01, R-02, R-03): horas extra
para optimizar el motor o contratar un servidor si se decide desplegar en la nube.

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
