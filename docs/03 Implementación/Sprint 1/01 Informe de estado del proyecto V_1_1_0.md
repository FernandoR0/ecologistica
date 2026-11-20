[← Volver al README Principal](../../../README.md)

# Informe de estado del proyecto

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

| Campo | Detalle |
|---|---|
| Sprint | Sprint 1 (02/09/2026 - 15/09/2026) |
| Sprint Goal | Base operativa: acceso por roles y registro de flota, conductores, clientes y pedidos con CI activo. |
| Story points completados | 22 de 22 |

## Historias de Usuario completadas en este Sprint

| Código | Título | Criterios de aceptación verificados | Pull Request / commit de cierre | Estado |
|---|---|---|---|---|
| US-001 | Iniciar sesión según mi rol | Acceso correcto abre el Dashboard con el menú del rol; credenciales inválidas responden 401; endpoints protegidos responden 401/403 según el rol. | [f5eb0b0](https://github.com/FernandoR0/ecologistica/commit/f5eb0b0) (API) · [c0ec63b](https://github.com/FernandoR0/ecologistica/commit/c0ec63b) (pantalla) | Done |
| US-002 | Gestionar la flota | Alta, edición y baja lógica de vehículos; placa duplicada responde 409. | [f5eb0b0](https://github.com/FernandoR0/ecologistica/commit/f5eb0b0) · [c0ec63b](https://github.com/FernandoR0/ecologistica/commit/c0ec63b) | Done |
| US-003 | Gestionar conductores | Alta con DNI de 8 dígitos y vehículo asignado; DNI duplicado responde 409. | [f5eb0b0](https://github.com/FernandoR0/ecologistica/commit/f5eb0b0) · [c0ec63b](https://github.com/FernandoR0/ecologistica/commit/c0ec63b) | Done |
| US-004 | Registrar clientes y sus preferencias | Horario preferido y días de atención; horario con fin antes del inicio rechazado (422). | [f5eb0b0](https://github.com/FernandoR0/ecologistica/commit/f5eb0b0) · [c0ec63b](https://github.com/FernandoR0/ecologistica/commit/c0ec63b) | Done |
| US-005 | Registrar pedidos | Pedido con ubicación, peso y ventana; ventana inválida rechazada (422); listado paginado de 12 en 12. | [f5eb0b0](https://github.com/FernandoR0/ecologistica/commit/f5eb0b0) · [2ab9ad9 (paginación)](https://github.com/FernandoR0/ecologistica/commit/2ab9ad9) | Done |
| ENB-001 | Integración continua | `ci.yml` ejecuta Ruff, pytest, ESLint, Vitest y build en cada push. | [e584b29](https://github.com/FernandoR0/ecologistica/commit/e584b29) | Done |

## Demostración del trabajo completado

Demostración a los stakeholders de las funcionalidades implementadas.

- Entorno: ejecución local con `docker compose up` (PostgreSQL 16, API FastAPI y frontend React).
- Se mostró el acceso con los tres roles iniciales, el alta de un vehículo y el rechazo de la placa duplicada, el alta de un conductor con su vehículo y el registro de un pedido con ventana horaria.
- Evidencias: ![Acceso](<../../06 Anexos/evidencias/e2e-01-login.png>) ![Flota](<../../06 Anexos/evidencias/e2e-04-flota.png>) ![Pedidos](<../../06 Anexos/evidencias/e2e-03-pedidos.png>)
- Pruebas automáticas que respaldan la demostración: `backend/tests/test_auth.py` y `backend/tests/test_api.py` (CRUD, duplicados y validaciones).

## Pendientes

- Los campos del enunciado oficial que no estaban en el primer formulario (volumen, año de fabricación, factor de emisión del vehículo; categoría de licencia, experiencia y disponibilidad del conductor; prioridad y tipo de producto del pedido) y el rol AUDITOR se incorporaron en el Sprint 4 como cambio de alcance aprobado (ver la revisión del Sprint 4, commit [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca)).

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 15/09/2026 | Fernando Rodrigo Chaupis Espinoza | Informe de estado del sprint |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Plantilla oficial de la consigna, enlaces a commits, enlace de retorno al README y nota de los campos completados en el Sprint 4 |

[← Volver al README Principal](../../../README.md)
