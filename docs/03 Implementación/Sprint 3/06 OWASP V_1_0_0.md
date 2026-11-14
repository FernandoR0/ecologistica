# OWASP Top 10

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

Evaluación frente al **OWASP Top 10 (2021)**.

| Riesgo | Control implementado | Evidencia en código |
|---|---|---|
| A01 Control de acceso roto | Roles ADMIN/PLANIFICADOR/CONDUCTOR en cada endpoint; el conductor solo ve sus rutas | `app/api/deps.py`, `test_conductor_no_puede_crear_vehiculos` |
| A02 Fallas criptográficas | Contraseñas con bcrypt (sal por usuario); JWT HS256 con expiración | `app/core/security.py` |
| A03 Inyección | ORM SQLAlchemy con consultas parametrizadas; validación de entradas con Pydantic (rangos, regex) | `app/schemas.py` |
| A04 Diseño inseguro | Reglas de negocio en servicios; bajas lógicas | `app/services/` |
| A05 Configuración insegura | CORS restringido a orígenes definidos; cabeceras `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`; secretos en `.env` | `app/main.py` |
| A06 Componentes vulnerables | Versiones fijadas en `requirements.txt` y `package.json`; revisar con `pip-audit` y `npm audit` | `pip-audit` encontró 24 avisos en PyJWT 2.10.1 y Starlette 0.46.2; se actualizó a PyJWT 2.15.1, FastAPI 0.162.7 y Starlette 1.10.0: **0 vulnerabilidades**. `npm audit` encontró 3 altas en react-router; se actualizó a 7.18.5: **0 en producción**. Quedan avisos solo en herramientas de desarrollo (Vitest, typescript-eslint) que no se despliegan. |
| A07 Fallas de autenticación | Bloqueo de 15 min tras 5 intentos fallidos; mensaje genérico "Credenciales inválidas" | `test_bloqueo_tras_cinco_intentos` |
| A08 Integridad de software | CI en GitHub Actions; ramas protegidas | `.github/workflows/ci.yml` |
| A09 Registro y monitoreo | _Completar_: agregar log de auditoría de acciones críticas | - |
| A10 SSRF | El backend no hace peticiones a URLs ingresadas por el usuario | - |

## Pendientes
- Rotar `JWT_SECRET` por entorno y usar HTTPS en staging.
- Ejecutar OWASP ZAP contra staging y adjuntar el reporte.
