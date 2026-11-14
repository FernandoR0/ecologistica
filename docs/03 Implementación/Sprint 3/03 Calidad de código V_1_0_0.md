# Evaluación de Calidad de Código - SonarQube

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

El análisis se hace en **SonarQube Cloud** con el workflow `.github/workflows/sonarcloud.yml`: en cada push a `main`
corre las pruebas del backend (pytest) y del frontend (Vitest) con cobertura y envía el análisis.

- Panel del proyecto: https://sonarcloud.io/project/overview?id=FernandoR0_ecologistica
- Configuración: `sonar-project.properties`

## 1. Resumen Ejecutivo de Quality Gate

| Indicador | Resultado | Meta |
|---|---|---|
| Estado del Quality Gate (Sonar way) | _Completar_ | PASSED |
| Cobertura de pruebas (Coverage) | _Completar_ (local: backend 90 %, frontend 99.7 %) | ≥ 80 % |
| Duplicación de código | _Completar_ | < 3 % |
| Calificación de seguridad | _Completar_ | A |
| Calificación de fiabilidad | _Completar_ | A |
| Calificación de mantenibilidad | _Completar_ | A |

![Resumen de SonarQube Cloud](<../../06 Anexos/evidencias/sonarqube-resumen.png>)

### Pruebas que alimentan la cobertura

| Componente | Pruebas | Cobertura local |
|---|:-:|:-:|
| Backend (pytest) | 27 | 90 % |
| Frontend (Vitest + Testing Library) | 43 | 99.7 % de líneas |
| E2E (Playwright, no cuenta en Sonar) | 4 | - |

## 2. Métricas Principales

| Categoría | Cantidad Detectada | Severidad (Bloqueante / Alta / Media / Baja) |
|---|:-:|---|
| **Bugs** | _Completar_ | _Completar_ |
| **Vulnerabilidades** | _Completar_ | _Completar_ |
| **Code Smells** | _Completar_ | _Completar_ |
| **Security Hotspots** | _Completar_ | _Completar_ |

Análisis estático adicional en el CI: **Ruff** (Python) y **ESLint + TypeScript** (frontend) con **0 observaciones**.

![Observaciones de SonarQube Cloud](<../../06 Anexos/evidencias/sonarqube-observaciones.png>)

## 3. Plan de Remediación y Deuda Técnica

**Deuda técnica estimada:** _Completar_ (dato del panel de SonarQube Cloud).

| # | Hallazgo | Ubicación | Severidad | Acción correctiva | Estado |
|---|---|---|---|---|---|
| 1 | _Completar_ | _Completar_ | _Completar_ | _Completar_ | _Completar_ |

### Correcciones de calidad ya atendidas antes del análisis

| Hallazgo | Herramienta | Acción |
|---|---|---|
| Cobertura del frontend en 10.7 % | Vitest | Se agregaron 38 pruebas de pantallas, sesión y cliente de la API; subió a 99.7 % |
| Dependencias con vulnerabilidades (PyJWT, Starlette, react-router) | pip-audit / npm audit | Actualizadas; 0 vulnerabilidades en producción (ver `04 OWASP`) |
| Mensaje de pedidos sin asignar ambiguo | Prueba E2E con capturas | Corregido en `Rutas.tsx` (DEF-01) |

### Comandos para el re-escaneo

```bash
git push origin main     # el workflow "SonarQube Cloud" vuelve a analizar el proyecto
```

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
