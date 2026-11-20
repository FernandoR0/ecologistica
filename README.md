# EcoLogística

**Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. (Huancayo, Junín)**

Proyecto Final de Asignatura - Taller de Proyectos 2, Universidad Continental, 2026-II · Docente: Daniel Gamarra Moreno

[![CI](https://github.com/FernandoR0/ecologistica/actions/workflows/ci.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/ci.yml)
[![Tests](https://github.com/FernandoR0/ecologistica/actions/workflows/tests.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/tests.yml)
[![Deploy](https://github.com/FernandoR0/ecologistica/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/deploy-production.yml)
[![Green IT](https://github.com/FernandoR0/ecologistica/actions/workflows/green-audit.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/green-audit.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=FernandoR0_ecologistica&metric=alert_status)](https://sonarcloud.io/summary/overall?id=FernandoR0_ecologistica&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=FernandoR0_ecologistica&metric=coverage)](https://sonarcloud.io/summary/overall?id=FernandoR0_ecologistica&branch=main)

**Aplicación en producción:** https://ecologistica.vercel.app · API y Swagger:
https://ecologistica-api-r17u.onrender.com/docs

**Probar sin instalar:** [![Abrir en GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/FernandoR0/ecologistica?quickstart=1)
(se necesita una cuenta de GitHub; ver [Probar en GitHub Codespaces](#probar-en-github-codespaces))

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
10. [Despliegue](#despliegue) (incluye [GitHub Codespaces](#probar-en-github-codespaces))
11. [Pruebas y calidad](#pruebas-y-calidad)
12. [Video explicativo](#video-explicativo)
13. [Documentación por fases](#documentación-por-fases) · [Fase 01: Inicio](#fase-01-inicio-del-proyecto) · [Fase 02: Planificación](#fase-02-planificación-del-proyecto) · [Fase 03: Implementación](#fase-03-implementación) · [Sprint 4](#sprint-4-inspección-05)
14. [Versionamiento](#versionamiento)
15. [Licencia](#licencia)

## Equipo

| Integrante | Rol |
|---|---|
| Fernando Rodrigo Chaupis Espinoza | Product Owner, Scrum Master y Developer (proyecto individual) |

Backlog, sprints y release `v1.0.0-MVP` en Jira Software (proyecto **ECO**); evidencia en
[02 Artefactos Jira](docs/02%20Planificaci%C3%B3n/02%20Artefactos%20Jira%20V_1_2_0.md).

## Problemática

DistriRápido S.A.C. reparte a bodegas, restaurantes, farmacias y minimarkets de Huancayo, El Tambo y Chilca. Las rutas se
arman a mano: se recorren kilómetros de más, se llega fuera del horario en que el cliente puede recibir, no se respeta
la jornada de los conductores y no se mide la huella de carbono de la flota.

## Producto Mínimo Viable (PMV)

El PMV (`v1.0.0`) permite a la empresa:

1. Registrar su flota, conductores (licencia, disponibilidad, jornada y punto de partida), clientes y pedidos,
   ubicándolos con un buscador de direcciones o lugares de referencia y un pin en el mapa.
2. Generar con un clic las rutas óptimas de todos los vehículos con un motor **VRPTW + Green VRP** (Google OR-Tools con
   **Búsqueda Tabú**), respetando peso y volumen, ventanas horarias, jornada con descanso de 1 h cada 4 h, la zona
   restringida del Centro y las zonas de riesgo.
3. Ver las rutas en el mapa con la congestión de cada tramo y re-optimizarlas ante tráfico, accidentes, bloqueos, clima,
   averías, pedidos nuevos o cancelaciones.
4. Medir el ahorro de kilómetros, combustible y CO₂, descargar el reporte PDF con el costo del ciclo de vida y
   planificar la compensación de carbono.
5. Dar al conductor un modo simplificado en el celular (navegación a cada entrega, confirmación con foto y
   funcionamiento sin señal) y validar la usabilidad con una encuesta SUS integrada.

Resultado con los datos de demostración: **-49.7 % de kilómetros y -57 % de CO₂** frente a la ruta sin optimizar.
Para 150 pedidos y 15 vehículos el plan se genera en **30 s** (meta ≤ 45 s).

## Funcionalidades

| RF | Funcionalidad | Dónde |
|---|---|---|
| RF-001 | Gestión de flota | Pantalla Flota · `api/routers/gestion.py` |
| RF-002 | Gestión de pedidos (paginada) con código automático; cancelar un pedido en ruta la re-optimiza | Pantalla Pedidos |
| RF-003 | Rutas optimizadas VRPTW + Green VRP con Búsqueda Tabú | Pantalla Rutas · `optimization/vrptw.py` |
| RF-004 | Rutas en el mapa (Leaflet + OpenStreetMap) con congestión por tramo, zonas y límites distritales | Pantalla Rutas |
| RF-005 | Dashboard: km, ahorro, CO₂, combustible ahorrado, % de entregas a tiempo y árboles equivalentes | Pantalla Dashboard |
| RF-006 | Reporte de sostenibilidad y **reporte PDF** con costo del ciclo de vida | Pantalla Sostenibilidad |
| RF-007 | Re-optimización ante tráfico, accidente, bloqueo, clima, avería, pedido nuevo o cancelación | Pantalla Rutas |
| RF-008 | Conductores con licencia, disponibilidad, jornada máxima y punto de partida; modo conductor con foto de entrega y sin conexión (RNF-006) | Pantallas Conductores y Mi ruta |
| RF-009 | Clientes: horario, días, punto de referencia, restricciones de acceso y ubicación con buscador de direcciones | Pantalla Clientes |
| RF-010 | Plan de compensación de carbono | Pantalla Sostenibilidad |
| RF-011 | Inicio de sesión con roles ADMIN, PLANIFICADOR, CONDUCTOR y AUDITOR; bloqueo tras 3 intentos | Login |
| RF-012 | Administración: usuarios, parámetros del motor, bitácora de auditoría (CSV) y resultados SUS | Pantalla Administración |

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, React Router, Leaflet |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic 2, ReportLab (PDF) |
| Optimización | Google OR-Tools (VRPTW) con la metaheurística Búsqueda Tabú |
| Base de datos | PostgreSQL 16 (SQLite en las pruebas) |
| Seguridad | JWT, bcrypt, roles, bloqueo por intentos fallidos, bitácora de auditoría |
| Calidad | pytest, Vitest, Playwright, Ruff, ESLint, SonarQube Cloud, Lighthouse CI, axe-core |
| DevOps | GitHub Actions (CI, Tests y Deploy), Vercel, Render, Docker y Docker Compose |

## Arquitectura

```text
Navegador ──> Frontend React (Vercel) ──REST/JSON + JWT sobre HTTPS──> API FastAPI (Render) ──> PostgreSQL 16 (Render)
                                                              │
                                                              ├──> Motor VRPTW + Green VRP (OR-Tools, Búsqueda Tabú)
                                                              └──> Reporte PDF (ReportLab)
```

El motor (`backend/app/optimization`) no depende de la base de datos: recibe pedidos y vehículos y devuelve las rutas,
así se prueba por separado. Detalle en el [Modelo C4](docs/01%20Inicio/12.%20Modelo%20C4%20V_1_2_0.md).

## Estructura del repositorio

```
.github/workflows/    ci.yml, tests.yml, deploy-production.yml, sonarcloud.yml y green-audit.yml
backend/
  app/api/            endpoints, roles, paginación y administración
  app/core/           configuración, seguridad y caché
  app/optimization/   motor VRPTW, distancias y emisiones
  app/services/       planificación, re-optimización, indicadores, reporte PDF y cálculo SUS
  app/models.py       tablas
  app/seed.py         datos de demostración
  scripts/            prueba de carga del motor
  tests/              pruebas unitarias y de integración (pytest)
frontend/
  src/                pantallas, componentes, cliente de la API y pruebas (Vitest)
  e2e/                pruebas de extremo a extremo (Playwright)
  playwright.config.ts
  vercel.json         despliegue del frontend
docs/                 documentación del curso por fases
render.yaml           despliegue de la API y la base de datos
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
| AUDITOR | auditor@ecologistica.pe | Audi123* |
| PLANIFICADOR (encuesta SUS) | evaluador@ecologistica.pe | Eval123* |

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

### Probar en GitHub Codespaces

Sin instalar nada: el botón **Abrir en GitHub Codespaces** crea un entorno en la nube con la configuración de
`.devcontainer/`. La primera vez tarda unos 3 a 5 minutos (instala dependencias y carga los datos de demostración);
luego la app se abre sola en el puerto **5173** (pestaña *Puertos* → "EcoLogística (web)"). Se ingresa con los
usuarios de demostración de la tabla de [Instalación](#instalación).

Las cuentas personales de GitHub tienen 120 horas-núcleo gratis al mes. Al terminar conviene detener el Codespace en
https://github.com/codespaces para no gastar horas.

### Producción (despliegue continuo)

| Componente | Servicio | Configuración |
|---|---|---|
| Frontend | Vercel ([ecologistica.vercel.app](https://ecologistica.vercel.app)) | `frontend/vercel.json`: build de Vite, reenvío de `/api` a la API y caché de un año para `/assets/` |
| API | Render (Docker, región Oregón) | `render.yaml` y `backend/Dockerfile` (usuario sin privilegios); `JWT_SECRET` generado por Render |
| Base de datos | PostgreSQL 16 gestionado en Render | Conexión inyectada en `DATABASE_URL` |

Cada push a `main` (o tag `v*`) ejecuta `deploy-production.yml`:

1. Repite el lint y las pruebas del backend.
2. Dispara el despliegue de la API en Render con el Deploy Hook y espera a que `/api/health` responda.
3. Compila y publica el frontend con la CLI de Vercel.
4. Corre las pruebas Playwright `@public` (Chromium) contra la URL de producción y guarda el reporte como artifact.

Credenciales en **GitHub Secrets**: `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` y
`SONAR_TOKEN`. Variables del repositorio: `API_URL` y `PRODUCCION_URL`. Ningún secreto está en el código; las
variables locales se toman de `.env.example`.

## Pruebas y calidad

```bash
cd backend && pytest --cov=app                          # 76 pruebas, cobertura 95 %
cd frontend && npm test -- --coverage                   # 105 pruebas, cobertura 99 %
cd backend && python -m scripts.prueba_carga 30 5       # 150 pedidos y 15 vehículos
cd frontend && E2E_PYTHON=python npx playwright test    # 28 pruebas E2E por navegador en Chromium, Firefox y WebKit
```

Resultados del Sprint 4: [análisis Playwright](docs/03%20Inplementaci%C3%B3n/Sprint%204/03%20Analisis%20PlayWrigth%20V_1_0_0.md)
(75/75 en local y 36/36 contra producción el 19/11/2026). El 20/11/2026, con las mejoras de la prueba de usabilidad,
la suite creció a 84/84 (28 casos por navegador).

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

Cada documento tiene un enlace de regreso a este README. Resumen de carpetas en el
[Índice de documentación](docs/00%20%C3%8Dndice%20de%20documentaci%C3%B3n.md).

## Fase 01: Inicio del Proyecto

- [01. Selección del enfoque del proyecto V_1_1_0](docs/01%20Inicio/01.%20Selecci%C3%B3n%20del%20enfoque%20del%20proyecto%20V_1_1_0.md)
- [02. Acta de constitución V_1_1_0](docs/01%20Inicio/02.%20Acta%20de%20constituci%C3%B3n%20V_1_1_0.md)
- [03. Declaración de la visión V_1_1_0](docs/01%20Inicio/03.%20Declaraci%C3%B3n%20de%20la%20visi%C3%B3n%20V_1_1_0.md)
- [04. Registro de supuestos y restricciones V_1_1_0](docs/01%20Inicio/04.%20Registro%20de%20supuestos%20y%20restricciones%20V_1_1_0.md)
- [05. Registro de interesados V_1_1_0](docs/01%20Inicio/05.%20Registro%20de%20interesados%20V_1_1_0.md)
- [06. Requisitos funcionales V_1_2_0](docs/01%20Inicio/06.%20Requisitos%20funcionales%20V_1_2_0.md)
- [07. Requisitos no funcionales V_1_2_0](docs/01%20Inicio/07.%20Requisitos%20no%20funcionales%20V_1_2_0.md)
- [08. Usuarios V_1_1_0](docs/01%20Inicio/08.%20Usuarios%20V_1_1_0.md)
- [09. Reglas de negocio V_1_1_0](docs/01%20Inicio/09.%20Reglas%20de%20negocio%20V_1_1_0.md)
- [10. Stack tecnológico V_1_1_0](docs/01%20Inicio/10.%20Stack%20tecnol%C3%B3gico%20V_1_1_0.md)
- [11. Base de datos V_1_3_0](docs/01%20Inicio/11.%20Base%20de%20datos%20V_1_3_0.md)
- [12. Modelo C4 V_1_2_0](docs/01%20Inicio/12.%20Modelo%20C4%20V_1_2_0.md)
- [13. Restricciones V_1_1_0](docs/01%20Inicio/13.%20Restricciones%20V_1_1_0.md)

## Fase 02: Planificación del Proyecto

- [01 Transformando a ágil V_1_1_0](docs/02%20Planificaci%C3%B3n/01%20Transformando%20a%20%C3%A1gil%20V_1_1_0.md)
- [02 Artefactos Jira V_1_2_0](docs/02%20Planificaci%C3%B3n/02%20Artefactos%20Jira%20V_1_2_0.md)
- [03 Registro de riesgos V_1_1_0](docs/02%20Planificaci%C3%B3n/03%20Registro%20de%20riesgos%20V_1_1_0.md)
- [04 Presupuesto del proyecto V_1_1_0](docs/02%20Planificaci%C3%B3n/04%20Presupuesto%20del%20proyecto%20V_1_1_0.md)
- [05 Cronograma de sprints V_1_1_0](docs/02%20Planificaci%C3%B3n/05%20Cronograma%20de%20sprints%20V_1_1_0.md)

## Fase 03: Implementación

### Sprint 1

- [01 Informe de estado del proyecto V_1_2_0](docs/03%20Implementaci%C3%B3n/Sprint%201/01%20Informe%20de%20estado%20del%20proyecto%20V_1_2_0.md)
- [02 Registro de Impedimentos V_1_2_0](docs/03%20Implementaci%C3%B3n/Sprint%201/02%20Registro%20de%20Impedimentos%20V_1_2_0.md)
- [03 Revisión del Sprint V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%201/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_1_0.md)
- [04 Retrospectiva del Sprint V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%201/04%20Retrospectiva%20del%20Sprint%20V_1_1_0.md)

### Sprint 2

- [01 Informe de estado del proyecto V_1_2_0](docs/03%20Implementaci%C3%B3n/Sprint%202/01%20Informe%20de%20estado%20del%20proyecto%20V_1_2_0.md)
- [02 Registro de Impedimentos V_1_2_0](docs/03%20Implementaci%C3%B3n/Sprint%202/02%20Registro%20de%20Impedimentos%20V_1_2_0.md)
- [03 Revisión del Sprint V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%202/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_1_0.md)
- [04 Retrospectiva del Sprint V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%202/04%20Retrospectiva%20del%20Sprint%20V_1_1_0.md)

### Sprint 03

- [01 Revisión del Sprint V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%2003/01%20Revisi%C3%B3n%20del%20Sprint%20V_1_1_0.md)
- [02 Retrospectiva del Sprint V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%2003/02%20Retrospectiva%20del%20Sprint%20V_1_1_0.md)
- [03 Calidad de código V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%2003/03%20Calidad%20de%20c%C3%B3digo%20V_1_1_0.md)
- [04 OWASP V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%2003/04%20OWASP%20V_1_1_0.md)
- [05 WCAG V_1_1_0](docs/03%20Implementaci%C3%B3n/Sprint%2003/05%20WCAG%20V_1_1_0.md)

### Inspección 04 - Reducción del impacto ambiental

- [01 Informe de reduccion del impacto ambiental V_1_2_0](docs/03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/01%20Informe%20de%20reduccion%20del%20impacto%20ambiental%20V_1_2_0.md)
- [02 Estandares Ingeniería de software V_1_2_0](docs/03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/02%20Estandares%20Ingenier%C3%ADa%20de%20software%20V_1_2_0.md)

### Sprint 4 (Inspección 05)

- [01 Revisión del Sprint V_1_0_0](docs/03%20Inplementaci%C3%B3n/Sprint%204/01%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md)
- [02 Retrospectiva del Sprint V_1_0_0](docs/03%20Inplementaci%C3%B3n/Sprint%204/02%20Retrospectiva%20del%20Sprint%20V_1_0_0.md)
- [03 Analisis PlayWrigth V_1_0_0](docs/03%20Inplementaci%C3%B3n/Sprint%204/03%20Analisis%20PlayWrigth%20V_1_0_0.md)
- [04 Usabilidad V_1_0_0](docs/03%20Inplementaci%C3%B3n/Sprint%204/04%20Usabilidad%20V_1_0_0.md)

### Estado de los workflows del Sprint 4

[![CI](https://github.com/FernandoR0/ecologistica/actions/workflows/ci.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/ci.yml) [![Tests](https://github.com/FernandoR0/ecologistica/actions/workflows/tests.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/tests.yml) [![Deploy a producción](https://github.com/FernandoR0/ecologistica/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/FernandoR0/ecologistica/actions/workflows/deploy-production.yml)

## Anexos

- [Manual de usuario V_1_2_0](docs/06%20Anexos/Manual%20de%20usuario%20V_1_2_0.md) (usuario y administrador)
- Documentación de la API: Swagger en https://ecologistica-api-r17u.onrender.com/docs

## Versionamiento

- Rama principal: `main`. Commits con [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`,
  `perf`, `test`, `docs`, `ci`).
- Versiones con **tags semánticos**: el PMV es **[`v1.0.0`](https://github.com/FernandoR0/ecologistica/releases/tag/v1.0.0)**.
- Cada documento lleva su versión vigente en el nombre (`V_1_0_0`, `V_1_1_0`…) y un historial de control de cambios;
  al modificar un documento de una fase anterior se incrementa su versión.

## Licencia

MIT
