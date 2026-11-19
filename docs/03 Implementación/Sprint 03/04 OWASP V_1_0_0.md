[← Volver al README Principal](../../../README.md)

# Reporte de Seguridad OWASP Top 10 (2025)

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Herramienta de Escaneo:** SonarQube / SonarCloud

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

Revisión del código del backend (FastAPI) y del frontend (React) frente al OWASP Top 10 2025, con apoyo de
`pip-audit`, `npm audit`, las pruebas automáticas y el análisis de SonarQube Cloud.

## 1. Matriz de Cumplimiento OWASP Top 10 2025

| Categoría OWASP 2025 | Estado en Proyecto (Limpio / Vulnerable / Bajo Revisión) | Hallazgos y controles |
|---|---|---|
| A01:2025-Broken Access Control | **Limpio** | Cada endpoint declara el rol con `require_roles` (`backend/app/api/deps.py`); un rol distinto recibe 403 y el frontend oculta el menú. El conductor solo ve sus rutas (`/rutas/mias`). Pruebas: `test_conductor_no_puede_crear_vehiculos`, E2E-04. |
| A02:2025-Security Misconfiguration | **Limpio** | CORS limitado a los orígenes de `CORS_ORIGINS`; cabeceras `X-Content-Type-Options`, `X-Frame-Options: DENY` y `Referrer-Policy` en todas las respuestas (`backend/app/main.py`); secretos en `.env`, fuera del repositorio. |
| A03:2025-Software Supply Chain Failures | **Limpio** (corregido) | `pip-audit` encontró 24 avisos en PyJWT 2.10.1 y Starlette 0.46.2; `npm audit` encontró 3 altas en react-router 7.5.0. Se actualizó a PyJWT 2.15.1, FastAPI 0.162.7, Starlette 1.10.0 y react-router-dom 7.18.5: **0 vulnerabilidades en producción**. Versiones fijadas y `package-lock.json` versionado. |
| A04:2025-Cryptographic Failures | **Limpio** | Contraseñas con bcrypt y sal por usuario; sesiones JWT HS256 con expiración de 8 horas (`backend/app/core/security.py`). |
| A05:2025-Injection | **Limpio** | Todo acceso a datos pasa por SQLAlchemy (consultas parametrizadas). Pydantic valida tipos, rangos y formatos (placa, DNI, horas, coordenadas del Valle del Mantaro); una entrada inválida responde 422. |
| A06:2025-Insecure Design | **Limpio** | Reglas de negocio en el servidor (capacidad, ventanas, jornada, pedidos planificados no editables); bajas lógicas para conservar historial. |
| A07:2025-Authentication Failures | **Limpio** | Bloqueo de 15 minutos tras 5 intentos fallidos y mensaje genérico «Credenciales inválidas». Prueba `test_bloqueo_tras_cinco_intentos`. |
| A08:2025-Software or Data Integrity Failures | **Limpio** (corregido) | CI en GitHub Actions en cada push; dependencias de Python bloqueadas por hash (`requirements*.lock`), `npm ci --ignore-scripts` y la acción de SonarQube fijada por SHA; dependencias fijadas; el frontend se compila en el pipeline. |
| A09:2025-Security Logging and Alerting Failures | **Limpio** (corregido) | Bitácora de auditoría (`auditoria`): cada escritura y cada inicio de sesión, correcto o fallido, se guarda con usuario, recurso, fecha y código de respuesta; el ADMIN la consulta en Administración. No se guardan contraseñas ni cuerpos de las peticiones. Prueba `test_auditoria_registra_escrituras_e_inicios_de_sesion`. |
| A10:2025-Mishandling of Exceptional Conditions | **Limpio** | Los errores de negocio responden 409 con un mensaje claro; un pedido imposible no tumba el plan (se informa como no asignado). Prueba `test_descarta_pedido_imposible_sin_romper_plan`. |

## 2. Detalles de Security Hotspots y Vulnerabilidades Críticas

| ID | Hallazgo | Herramienta | Severidad | Ubicación | Acción | Estado |
|---|---|---|---|---|---|---|
| SEC-01 | PyJWT 2.10.1 con vulnerabilidades publicadas (17 avisos) | pip-audit | Alta | `backend/requirements.txt` | Actualizar a 2.15.1 | Corregido |
| SEC-02 | Starlette 0.46.2 con vulnerabilidades publicadas (7 avisos) | pip-audit | Alta | Dependencia de FastAPI | Fijar Starlette 1.10.0 con FastAPI 0.162.7 | Corregido |
| SEC-03 | react-router 7.5.0 y turbo-stream con 3 vulnerabilidades altas | npm audit | Alta | `frontend/package.json` | Actualizar a react-router-dom 7.18.5 | Corregido |
| SEC-04 | Avisos en herramientas de desarrollo (Vitest, typescript-eslint) | npm audit | Moderada | Solo `devDependencies` | No se despliegan; actualizar al cambiar de versión mayor | Aceptado |
| SEC-05 | Instalación de dependencias sin bloqueo por hash, con scripts de terceros y sin solo binarios (12 hallazgos) | SonarQube Cloud | Mayor | Workflows y Dockerfiles | `requirements*.lock` con hashes, `--require-hashes`, `--only-binary :all:`, `--ignore-scripts` | Corregido |
| SEC-06 | Acción de GitHub de terceros referenciada por etiqueta | SonarQube Cloud | Mayor | `sonarcloud.yml` | Fijada por SHA | Corregido |
| SEC-07 | Ruta enviada por el usuario usada para leer archivos (Filesystem Oracle) | SonarQube Cloud | Mayor | `frontend/scripts/servidor-estatico.mjs` | Lista de archivos permitidos armada al iniciar | Corregido |
| SEC-08 | Contenedor de nginx con usuario root | SonarQube Cloud | Menor | `frontend/Dockerfile` | `nginx-unprivileged` en el puerto 8080 | Corregido |
| SEC-09 | Security Hotspots | SonarQube Cloud | - | - | 0 encontrados | Limpio |

### Verificación

```bash
cd backend && pip-audit -r requirements.txt        # No known vulnerabilities found
cd frontend && npm audit --omit=dev               # found 0 vulnerabilities
cd backend && pytest tests/test_auth.py -v        # 7 pruebas de seguridad aprobadas
```

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Ubicación oficial `Sprint 03`, plantilla de la consigna y enlace de retorno al README |

[← Volver al README Principal](../../../README.md)
