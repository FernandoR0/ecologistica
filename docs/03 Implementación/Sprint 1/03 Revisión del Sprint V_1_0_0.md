# Revisión del Sprint 1

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

**Sprint 1:** 02/09/2026 - 15/09/2026

**Sprint Goal:** Base del sistema: autenticación con roles y gestión de flota, conductores y pedidos.

## Historias de Usuario completadas en este Sprint

| ID | Criterio verificado | Estado |
|---|---|---|
| US-001 | Login, bloqueo tras 5 intentos y 403 por rol | Completada |
| US-002 | Alta, edición, placa duplicada (409) y baja lógica | Completada |
| US-003 | Conductor con vehículo asignado | Completada |
| US-004 | Pedidos validados y listado paginado | Completada |

**Story points completados:** 16 de 16

## Demostración del trabajo completado

- **US-001:** Login, bloqueo tras 5 intentos y 403 por rol. ![US-001](<../../06 Anexos/evidencias/e2e-01-login.png>)
- **US-002:** Alta, edición, placa duplicada (409) y baja lógica. ![US-002](<../../06 Anexos/evidencias/e2e-04-flota.png>)
- **US-003:** Conductor con vehículo asignado. ![US-003](<../../06 Anexos/evidencias/e2e-05-conductores.png>)
- **US-004:** Pedidos validados y listado paginado. ![US-004](<../../06 Anexos/evidencias/e2e-03-pedidos.png>)

Pruebas automáticas del sprint: test_auth.py (7 pruebas), test_crud_vehiculo_y_duplicado, test_validacion_pedido.

## Pendientes

- Ninguno. Todas las historias comprometidas quedaron completadas.

## Retroalimentación del docente

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
