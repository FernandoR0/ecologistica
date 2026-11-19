[← Volver al README Principal](../../../README.md)

# Evaluación de Calidad de Código - SonarQube

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Fecha de Análisis:** 2026-11-14

**Versión del Análisis:** V_1_0_0

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

El análisis se hace en **SonarQube Cloud** con el workflow `.github/workflows/sonarcloud.yml`: en cada push a `main`
corre las pruebas del backend (pytest) y del frontend (Vitest) con cobertura y envía el análisis.

- Panel del proyecto: https://sonarcloud.io/summary/overall?id=FernandoR0_ecologistica&branch=main
- Configuración: `sonar-project.properties`
- Quality Gate: **Sonar way** (código nuevo con calificación A, cobertura ≥ 80 %, duplicación ≤ 3 % y hotspots revisados)

## 1. Resumen Ejecutivo de Quality Gate

| Indicador | Primer análisis (14/11/2026, commit `59d4657`) | Análisis final (14/11/2026, commit `58e82f0`) |
|---|:-:|:-:|
| **Estado del Quality Gate** | Passed | **PASSED** |
| Cobertura de pruebas (Coverage) | 87.6 % | **90.6 %** |
| Cobertura del código nuevo | - | **100 %** |
| Duplicación de código | 78.0 % | **1.0 %** |
| Cuestiones abiertas de seguridad | 17 (calificación C) | **0 (A)** |
| Cuestiones abiertas de fiabilidad | 53 (calificación C) | **0 (A)** |
| Cuestiones abiertas de mantenibilidad | 5 (calificación A) | **0 (A)** |
| Security Hotspots | 0 | **0** |
| Deuda técnica | 2 d 6 h (75 cuestiones) | **0** |
| Líneas de código analizadas | 12.9 k | 2.6 k |

El primer análisis incluyó por error los reportes HTML de Lighthouse guardados como evidencia en `docs/` (código
JavaScript minificado de Google). De ahí venían 56 de las 75 cuestiones y la duplicación de 78 %. Los otros 19
hallazgos eran del proyecto y se corrigieron (sección 3).

**Antes:**

![Resumen de SonarQube Cloud - primer análisis](<../../06 Anexos/evidencias/sonarqube-antes-resumen.png>)

**Después:**

![Resumen de SonarQube Cloud - análisis final](<../../06 Anexos/evidencias/sonarqube-despues-resumen.png>)

### Pruebas que alimentan la cobertura

| Componente | Pruebas | Cobertura |
|---|:-:|:-:|
| Backend (pytest) | 27 | 90 % |
| Frontend (Vitest + Testing Library) | 43 | 99.7 % de líneas |
| Total en SonarQube | 70 | **90.6 %** (1 850 líneas por cubrir) |
| E2E (Playwright, no cuenta en Sonar) | 4 | - |

## 2. Métricas Principales

| Categoría | Primer análisis | Severidad (primer análisis) | Análisis final |
|---|:-:|---|:-:|
| **Bugs** | 41 | 40 en los reportes HTML de `docs/` (Mayor) · 1 en `Login.tsx` (Mayor) | **0** |
| **Vulnerabilidades** | 17 | 15 Mayor · 2 Menor, todas en workflows, Dockerfiles y el servidor estático | **0** |
| **Code Smells** | 17 | 16 en los reportes HTML de `docs/` · 1 Bloqueante en `config.py` | **0** |
| **Security Hotspots** | 0 | Sin observaciones | **0** |

Hallazgos del proyecto en el primer análisis (sin contar los reportes HTML):

| Regla | Tipo | Severidad | Cantidad | Dónde |
|---|---|---|:-:|---|
| githubactions:S6505 / docker:S6505 | Vulnerabilidad | Mayor | 6 | `npm ci` / `npx` sin `--ignore-scripts` en los 3 workflows y en `frontend/Dockerfile` |
| githubactions:S8541 / docker:S8541 | Vulnerabilidad | Mayor | 3 | `pip install` sin `--only-binary :all:` en `ci.yml`, `sonarcloud.yml` y `backend/Dockerfile` |
| githubactions:S8544 / docker:S8544 | Vulnerabilidad | Mayor | 3 | Dependencias de Python sin versiones bloqueadas por hash |
| githubactions:S8543 | Vulnerabilidad | Mayor | 1 | `npx vitest` sin versión exacta en `sonarcloud.yml` |
| githubactions:S7637 | Vulnerabilidad | Mayor | 1 | Acción `sonarqube-scan-action` referenciada por etiqueta y no por SHA |
| jssecurity:S6549 | Vulnerabilidad | Mayor | 1 | `frontend/scripts/servidor-estatico.mjs`: la ruta pedida llegaba al sistema de archivos |
| javascript:S5332 | Vulnerabilidad | Menor | 1 | `servidor-estatico.mjs`: URL con `http://` |
| docker:S6471 | Vulnerabilidad | Menor | 1 | `frontend/Dockerfile`: nginx corría como root |
| typescript:S9383 | Bug | Mayor | 1 | `Login.tsx`: la promesa de `navigate('/')` no se esperaba |
| python:S1845 | Code smell | Bloqueante | 1 | `config.py`: propiedad `cors_origins` con nombre casi igual al campo `CORS_ORIGINS` |

Análisis estático adicional en el CI: **Ruff** (Python) y **ESLint + TypeScript** (frontend) con 0 observaciones.

![Observaciones de SonarQube Cloud - primer análisis](<../../06 Anexos/evidencias/sonarqube-antes-observaciones.png>)

## 3. Plan de Remediación y Deuda Técnica

**Deuda técnica estimada en el primer análisis:** 2 días y 6 horas (75 cuestiones). **Deuda final:** 0.

| # | Hallazgo | Ubicación | Severidad | Acción correctiva | Estado |
|---|---|---|---|---|---|
| 1 | Reportes HTML de evidencia analizados como código | `docs/**` | Mayor (56 cuestiones) | Excluir `docs/**` en `sonar.exclusions`: son evidencias, no código del sistema | Corregido |
| 2 | Scripts de instalación de terceros | Workflows y `frontend/Dockerfile` | Mayor | `npm ci --ignore-scripts`, `npm install -g --ignore-scripts` y `npm test` en lugar de `npx` | Corregido |
| 3 | Paquetes de Python que podían ejecutar `setup.py` | `ci.yml`, `sonarcloud.yml`, `backend/Dockerfile` | Mayor | `pip install --only-binary :all:` | Corregido |
| 4 | Dependencias sin versiones bloqueadas | Backend | Mayor | `requirements.lock` y `requirements-dev.lock` con hashes (`uv pip compile --generate-hashes`) y `pip install --require-hashes` | Corregido |
| 5 | Acción de terceros por etiqueta | `sonarcloud.yml` | Mayor | Fijada por SHA `59202af…` (v8.5.0) | Corregido |
| 6 | Ruta del usuario usada para leer archivos | `servidor-estatico.mjs` | Mayor | Al iniciar se arma la lista de archivos de `dist/`; la ruta pedida solo se busca en esa lista. Se quitó la URL con `http://` | Corregido |
| 7 | nginx como root | `frontend/Dockerfile` | Menor | Imagen `nginxinc/nginx-unprivileged:1.27-alpine` en el puerto 8080 | Corregido |
| 8 | Promesa sin esperar | `Login.tsx` | Mayor | `await navigate('/')` | Corregido |
| 9 | Nombre confuso | `config.py` | Bloqueante | Propiedad renombrada a `lista_cors` | Corregido |
| 10 | Cobertura del código nuevo en 10.5 % | Scripts de medición (`frontend/scripts`, `backend/scripts`) | Quality Gate | Excluidos del cálculo de cobertura con `sonar.coverage.exclusions` (herramientas, no código del sistema) | Corregido |

### Correcciones de calidad atendidas antes del análisis

| Hallazgo | Herramienta | Acción |
|---|---|---|
| Cobertura del frontend en 10.7 % | Vitest | Se agregaron 38 pruebas de pantallas, sesión y cliente de la API; subió a 99.7 % |
| Dependencias con vulnerabilidades (PyJWT, Starlette, react-router) | pip-audit / npm audit | Actualizadas; 0 vulnerabilidades en producción (ver `04 OWASP`) |
| Mensaje de pedidos sin asignar ambiguo | Prueba E2E con capturas | Corregido en `Rutas.tsx` (DEF-01) |

### Verificación final

![Observaciones de SonarQube Cloud - análisis final](<../../06 Anexos/evidencias/sonarqube-despues-observaciones.png>)

- Quality Gate **PASSED** con 0 cuestiones abiertas y cobertura de 90.6 %.
- CI, auditoría Green IT y SonarQube Cloud en verde para el commit `58e82f0`.

### Comandos para el re-escaneo

```bash
git push origin main     # el workflow "SonarQube Cloud" vuelve a analizar el proyecto
```

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial con el análisis antes y después en SonarQube Cloud |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Ubicación oficial `Sprint 03`, plantilla de la consigna y enlace de retorno al README |

[← Volver al README Principal](../../../README.md)
