# EcoLogística

**Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. (Huancayo, Junín)**

Proyecto Final de Asignatura - Taller de Proyectos 2, Universidad Continental, 2026-II · Docente: Daniel Gamarra Moreno

[![CI](https://github.com/FernandoR0/ecologistica/actions/workflows/ci.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/ci.yml)
[![Green IT](https://github.com/FernandoR0/ecologistica/actions/workflows/green-audit.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/green-audit.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=FernandoR0_ecologistica&metric=alert_status)](https://sonarcloud.io/summary/overall?id=FernandoR0_ecologistica&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=FernandoR0_ecologistica&metric=coverage)](https://sonarcloud.io/summary/overall?id=FernandoR0_ecologistica&branch=main)

## Tabla de contenido

1. [Equipo](#equipo)
2. [Problemática](#problemática)
3. [Producto Mínimo Viable (PMV)](#producto-mínimo-viable-pmv)
4. [Funcionalidades](#funcionalidades)
5. [Tecnologías](#tecnologías)
6. [Arquitectura](#arquitectura)
7. [Estructura del repositorio](#estructura-del-repositorio)
8. [Instalación](#instalación)
9. [Build](#build)
10. [Despliegue](#despliegue)
11. [Pruebas y calidad](#pruebas-y-calidad)
12. [Video explicativo](#video-explicativo)
13. [Documentación por fases](#documentación-por-fases)
14. [Versionamiento](#versionamiento)
15. [Licencia](#licencia)

## Equipo

| Integrante | Rol |
|---|---|
| Fernando Rodrigo Chaupis Espinoza | Product Owner, Scrum Master y Developer (proyecto individual) |

Backlog y sprints: [issues](https://github.com/FernandoR0/ecologistica/issues?q=is%3Aissue) ·
[hitos](https://github.com/FernandoR0/ecologistica/milestones?state=all)

## Problemática

DistriRápido S.A.C. reparte a bodegas, restaurantes, farmacias y minimarkets de Huancayo, El Tambo y Chilca. Las rutas se
arman a mano: se recorren kilómetros de más, se llega fuera del horario en que el cliente puede recibir, no se respeta
la jornada de los conductores y no se mide la huella de carbono de la flota.

## Producto Mínimo Viable (PMV)

El PMV (`v1.0.0`) permite a la empresa:

1. Registrar su flota, conductores (con jornada y punto de partida), pedidos y preferencias de sus clientes.
2. Generar con un clic las rutas óptimas de todos los vehículos con un motor **VRPTW + Green VRP** (Google OR-Tools con
   **Búsqueda Tabú**), respetando capacidad, ventanas horarias, preferencias y jornada.
3. Ver las rutas en el mapa y re-optimizarlas ante tráfico, bloqueos, clima, averías, pedidos nuevos o cancelaciones.
4. Medir el ahorro de kilómetros, combustible y CO₂, descargar el reporte PDF y planificar la compensación de carbono.

Resultado con los datos de demostración: **-49.7 % de kilómetros y -57 % de CO₂** frente a la ruta sin optimizar.
Para 150 pedidos y 15 vehículos el plan se genera en **30 s** (meta ≤ 45 s).

## Funcionalidades

| RF | Funcionalidad | Dónde |
|---|---|---|
| RF-001 | Gestión de flota | Pantalla Flota · `api/routers/gestion.py` |
| RF-002 | Gestión de pedidos (paginada) | Pantalla Pedidos |
| RF-003 | Rutas optimizadas VRPTW + Green VRP con Búsqueda Tabú | Pantalla Rutas · `optimization/vrptw.py` |
| RF-004 | Rutas en el mapa (Leaflet + OpenStreetMap) | Pantalla Rutas |
| RF-005 | Dashboard: km, ahorro, CO₂, combustible ahorrado, % de entregas a tiempo y árboles equivalentes | Pantalla Dashboard |
| RF-006 | Reporte de sostenibilidad y **reporte PDF** descargable | Pantalla Sostenibilidad |
| RF-007 | Re-optimización ante tráfico, bloqueo, clima, avería, pedido nuevo o cancelación | Pantalla Rutas |
| RF-008 | Conductores con jornada máxima y punto de partida | Pantalla Conductores |
| RF-009 | Preferencias del cliente: horario, días, punto de referencia y restricciones de acceso | Pantalla Preferencias |
| RF-010 | Plan de compensación de carbono | Pantalla Sostenibilidad |
| RF-011 | Inicio de sesión con roles ADMIN, PLANIFICADOR y CONDUCTOR | Login |
| RF-012 | Administración: usuarios, parámetros del motor y bitácora de auditoría | Pantalla Administración |

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, React Router, Leaflet |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic 2, ReportLab (PDF) |
| Optimización | Google OR-Tools (VRPTW) con la metaheurística Búsqueda Tabú |
| Base de datos | PostgreSQL 16 (SQLite en las pruebas) |
| Seguridad | JWT, bcrypt, roles, bloqueo por intentos fallidos, bitácora de auditoría |
| Calidad | pytest, Vitest, Playwright, Ruff, ESLint, SonarQube Cloud, Lighthouse CI, axe-core |
| DevOps | Docker, Docker Compose, nginx, GitHub Actions |

## Arquitectura

```text
Navegador ──> Frontend React (nginx) ──REST/JSON + JWT──> API FastAPI ──> PostgreSQL
                                                              │
                                                              ├──> Motor VRPTW + Green VRP (OR-Tools, Búsqueda Tabú)
                                                              └──> Reporte PDF (ReportLab)
```

El motor (`backend/app/optimization`) no depende de la base de datos: recibe pedidos y vehículos y devuelve las rutas,
así se prueba por separado. Detalle en el [Modelo C4](docs/01%20Inicio/12.%20Modelo%20C4%20V_1_0_0.md).

## Estructura del repositorio

```
backend/
  app/api/            endpoints, roles, paginación y administración
  app/core/           configuración, seguridad y caché
  app/optimization/   motor VRPTW, distancias y emisiones
  app/services/       planificación, re-optimización, indicadores y reporte PDF
  app/models.py       tablas
  app/seed.py         datos de demostración
  scripts/            prueba de carga del motor
  tests/              pruebas unitarias y de integración (pytest)
frontend/
  src/                pantallas, componentes, cliente de la API y pruebas (Vitest)
  scripts/            servidor estático para medir el build
e2e/                  pruebas de extremo a extremo (Playwright)
docs/                 documentación del curso por fases
```

## Instalación

Requisitos: Python 3.12, Node.js 22 y, si se usa Docker, Docker Desktop.

```bash
git clone https://github.com/FernandoR0/ecologistica.git
cd ecologistica
cp .env.example .env
```

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Linux / Mac: source .venv/bin/activate
pip install --only-binary :all: --require-hashes -r requirements-dev.lock
python -m app.seed                # crea las tablas y los datos de demostración
uvicorn app.main:app --reload     # API en http://localhost:8000 · Swagger en /docs
```

**Frontend**

```bash
cd frontend
npm ci --ignore-scripts
npm run dev                       # http://localhost:5173
```

Usuarios de demostración (creados por `python -m app.seed`):

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | admin@ecologistica.pe | Admin123* |
| PLANIFICADOR | planificador@ecologistica.pe | Plan123* |
| CONDUCTOR | conductor@ecologistica.pe | Cond123* |

## Build

```bash
cd frontend && npm run build      # genera dist/ con archivos .br y .gz precomprimidos
docker build -t ecologistica-api backend
docker build -t ecologistica-web frontend
```

## Despliegue

Con Docker Compose (base de datos, API y frontend):

```bash
docker compose up --build
```

En producción el frontend se sirve con `frontend/Dockerfile` (nginx sin privilegios en el puerto 8080, caché de un año
para `/assets/` y archivos precomprimidos) y la API con `backend/Dockerfile` (usuario sin privilegios). Las variables
de entorno están en `.env.example`; `JWT_SECRET` debe cambiarse antes de desplegar.

## Pruebas y calidad

```bash
cd backend && pytest --cov=app                    # 39 pruebas, cobertura 93 %
cd frontend && npm test -- --coverage             # 55 pruebas, cobertura 99.8 %
cd backend && python -m scripts.prueba_carga 30 5 # 150 pedidos y 15 vehículos
pytest e2e -v                                     # pruebas E2E con Playwright
```

| Indicador | Resultado |
|---|---|
| SonarQube Cloud | Quality Gate **PASSED**, 0 bugs, 0 vulnerabilidades, 0 code smells |
| Lighthouse (escritorio, 4 pantallas) | Cumple los 6 umbrales de la consigna |
| Accesibilidad | 0 violaciones WCAG 2.1 AA (axe-core, 8 pantallas) |
| Dependencias de producción | 0 vulnerabilidades (pip-audit, npm audit) |

## Video explicativo

Video de demostración del sistema (máximo 5 minutos):
**[ecologistica-demo.mp4](https://github.com/FernandoR0/ecologistica/releases/download/v1.0.0/ecologistica-demo.mp4)**

Recorrido: inicio de sesión, gestión de pedidos y flota, generación de rutas en el mapa, re-optimización ante un
incidente, dashboard, reporte de sostenibilidad con PDF y administración.

## Documentación por fases

Índice completo: [docs/00 Índice de documentación](docs/00%20%C3%8Dndice%20de%20documentaci%C3%B3n.md)

| Fase | Documentos |
|---|---|
| 1. Inicio | [docs/01 Inicio](docs/01%20Inicio) - enfoque, acta, visión, supuestos, interesados, RF, RNF, usuarios, reglas, stack, BD, C4, restricciones |
| 2. Planificación | [docs/02 Planificación](docs/02%20Planificaci%C3%B3n) - transformación ágil, artefactos Jira, riesgos, presupuesto, cronograma |
| 3. Implementación | [Sprint 1](docs/03%20Implementaci%C3%B3n/Sprint%201) · [Sprint 2](docs/03%20Implementaci%C3%B3n/Sprint%202) · [Sprint 3](docs/03%20Implementaci%C3%B3n/Sprint%203) · [Sprint 4](docs/03%20Implementaci%C3%B3n/Sprint%204) · [Sprint 5](docs/03%20Implementaci%C3%B3n/Sprint%205) · [Inspección 04 - Green IT](docs/03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental) |
| 4. Seguimiento y Control | [docs/04 Seguimiento y Control](docs/04%20Seguimiento%20y%20Control) |
| 5. Cierre | [docs/05 Cierre](docs/05%20Cierre) |
| Anexos | [docs/06 Anexos](docs/06%20Anexos) - pruebas, SUS, manual de usuario, defectos, incidentes, informe técnico |

## Versionamiento

- Rama principal: `main`. Commits con [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`,
  `perf`, `test`, `docs`, `ci`).
- Versiones con **tags semánticos**: el PMV es **[`v1.0.0`](https://github.com/FernandoR0/ecologistica/releases/tag/v1.0.0)**.
- Cada documento lleva su versión en el nombre (`V_1_0_0`) y un historial de control de cambios.

## Licencia

MIT
