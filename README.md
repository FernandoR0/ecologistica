# EcoLogística

Sistema web para planificar las rutas de reparto de **DistriRápido S.A.C.** en Huancayo, El Tambo y Chilca.
Asigna los pedidos a los vehículos y ordena las paradas buscando recorrer menos kilómetros y contaminar menos,
respetando la capacidad de cada vehículo, el horario de los clientes y la jornada de los conductores (VRPTW + Green VRP).

Proyecto Final de Asignatura - Taller de Proyectos 2, Universidad Continental, 2026-II.

## Equipo

| Integrante | Rol |
|---|---|
| Fernando Rodrigo Chaupis Espinoza | Product Owner, Scrum Master y Developer (proyecto individual) |

Backlog y sprints: [issues](https://github.com/FernandoR0/ecologistica/issues?q=is%3Aissue) · [hitos](https://github.com/FernandoR0/ecologistica/milestones?state=all)

## Funcionalidades

| RF | Funcionalidad | Dónde está |
|---|---|---|
| RF-001 | Gestión de flota | `backend/app/api/routers/gestion.py`, pantalla Flota |
| RF-002 | Gestión de pedidos | `gestion.py`, pantalla Pedidos |
| RF-003 | Generación de rutas optimizadas | `backend/app/optimization/vrptw.py`, pantalla Rutas |
| RF-004 | Rutas en el mapa | Pantalla Rutas (Leaflet + OpenStreetMap) |
| RF-005 | Dashboard de indicadores | `GET /api/indicadores`, pantalla Dashboard |
| RF-006 | Reporte de sostenibilidad | `GET /api/indicadores/sostenibilidad` |
| RF-007 | Re-optimización ante incidentes | `POST /api/rutas/{id}/reoptimizar` |
| RF-008 | Gestión de conductores y jornada | `gestion.py`, pantalla Conductores |
| RF-009 | Preferencias de recepción de clientes | Pantalla Preferencias |
| RF-010 | Plan de compensación de carbono | `GET /api/compensacion/plan`, pantalla Sostenibilidad |

## Tecnologías

- **Frontend:** React 19, Vite, TypeScript, Leaflet
- **Backend:** Python 3.12, FastAPI, SQLAlchemy
- **Optimización:** Google OR-Tools
- **Base de datos:** PostgreSQL (SQLite para las pruebas)
- **Seguridad:** JWT, bcrypt, roles ADMIN / PLANIFICADOR / CONDUCTOR
- **Calidad:** pytest, Vitest, Ruff, ESLint, SonarQube
- **Despliegue:** Docker Compose, GitHub Actions

## Arquitectura

```text
Frontend (React)  --REST/JSON-->  API FastAPI  -->  PostgreSQL
                                     |
                                     +--> Motor de rutas (OR-Tools)
```

El motor de rutas (`backend/app/optimization`) no depende de la base de datos: recibe los pedidos y vehículos
y devuelve las rutas. Así se puede probar por separado.

## Estructura

```
backend/
  app/api/            endpoints y control de roles
  app/core/           configuración y seguridad
  app/optimization/   motor VRPTW, distancias y emisiones
  app/services/       planificación, re-optimización e indicadores
  app/models.py       tablas
  app/seed.py         datos de prueba
  tests/
frontend/src/         pantallas, componentes y cliente de la API
docs/                 documentación del curso
```

## Cómo ejecutarlo

Con Docker:

```bash
cp .env.example .env
docker compose up --build
```

Frontend en http://localhost:5173 y la API (con Swagger) en http://localhost:8000/docs

Sin Docker:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
python -m app.seed
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

Usuario de prueba: `admin@ecologistica.pe` / `Admin123*` (lo crea `python -m app.seed`).

## Pruebas

```bash
cd backend && pytest --cov=app             # 27 pruebas, cobertura 90 %
cd frontend && npm test                    # 5 pruebas
cd backend && python -m scripts.prueba_carga 30 5   # 150 pedidos y 15 vehículos
pytest e2e -v                              # 4 pruebas E2E con Playwright (ver docs/06 Anexos)
```

## Endpoints principales

| Método | Ruta | Quién |
|---|---|---|
| POST | `/api/auth/login` | Público |
| CRUD | `/api/vehiculos`, `/api/conductores`, `/api/pedidos` | Admin, planificador |
| PUT | `/api/preferencias/{cliente}` | Admin, planificador |
| POST | `/api/rutas/optimizar` | Admin, planificador |
| POST | `/api/rutas/{id}/reoptimizar` | Admin, planificador |
| GET | `/api/rutas`, `/api/rutas/mias` | Usuarios / conductor |
| GET | `/api/indicadores`, `/api/indicadores/sostenibilidad` | Usuarios |
| GET/POST | `/api/compensacion` | Admin |

## Documentación

Está en la carpeta [`docs/`](docs/00%20Índice%20de%20documentación.md): Inicio, Planificación, Implementación por sprint,
Seguimiento y Control, Cierre y Anexos.

## Licencia

MIT
