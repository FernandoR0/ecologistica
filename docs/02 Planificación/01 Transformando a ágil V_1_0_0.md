# Transformando a ágil

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

## Marco de trabajo
Scrum con sprints de 2 semanas. Eventos: Sprint Planning, Daily (15 min), Sprint Review y Retrospectiva.

## Roles Scrum

| Rol | Integrante |
|---|---|
| Product Owner | Fernando Rodrigo Chaupis Espinoza |
| Scrum Master | Fernando Rodrigo Chaupis Espinoza |
| Developer | Fernando Rodrigo Chaupis Espinoza |

Al ser un proyecto individual, los tres roles los cumple la misma persona. La Daily se reemplaza por el registro de avance en los issues y commits del repositorio, y la Sprint Review se hace con el docente.

## Definición de Listo (DoR)
- Historia con criterio de aceptación en Gherkin.
- Estimada en Story Points.
- Sin dependencias bloqueantes.

## Definición de Hecho (DoD)
- Código revisado por otro integrante (Pull Request).
- Pruebas automatizadas en verde en GitHub Actions.
- Cobertura del backend ≥ 80 %.
- Documentación del sprint actualizada.

## Product Backlog
| ID | Historia / Enabler | Requisito | SP | Sprint |
|---|---|---|:-:|:-:|
| US-001 | Inicio de sesión y control de acceso por roles | RNF-SEG | 5 | 1 |
| US-002 | Gestión de flota vehicular | RF-001 | 3 | 1 |
| US-003 | Gestión de conductores y asignación de vehículo | RF-008 | 3 | 1 |
| US-004 | Registro y gestión de pedidos con ventana horaria | RF-002 | 5 | 1 |
| US-005 | Motor VRPTW + Green VRP (OR-Tools) | RF-003 | 13 | 2 |
| US-006 | Visualización de rutas en mapa | RF-004 | 5 | 2 |
| US-007 | Control de jornada máxima del conductor | RF-008 | 5 | 3 |
| US-008 | Preferencias de recepción de clientes | RF-009 | 5 | 3 |
| US-009 | Re-optimización dinámica ante incidentes | RF-007 | 8 | 3 |
| US-010 | Dashboard de indicadores | RF-005 | 5 | 4 |
| US-011 | Reporte de sostenibilidad (CO₂ por ruta y combustible) | RF-006 | 5 | 4 |
| US-012 | Plan de compensación de carbono | RF-010 | 3 | 4 |
| ENB-001 | CI/CD, Docker y despliegue en staging | RNF-OPE | 5 | 5 |
| ENB-002 | Pruebas E2E, usabilidad SUS y auditoría Green IT | RNF-CAL | 5 | 5 |
