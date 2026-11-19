[← Volver al README Principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

## ¿Qué aprendimos?

- bcrypt solo admite contraseñas de hasta 72 bytes; se limitó la longitud en la validación para no devolver un error 500.
- Validar en la API que las coordenadas estén dentro del área de operación evita pedidos que luego no se pueden planificar.
- Las bajas lógicas (vehículos y conductores inactivos, pedidos cancelados) conservan el historial de rutas.
- Responder 409 (duplicado) y 422 (dato inválido) con mensajes claros permite escribir los escenarios Gherkin como pruebas automáticas.

## ¿Qué estamos haciendo bien?

- Escribir la prueba de cada criterio de aceptación junto con el endpoint.
- El pipeline de CI desde el primer sprint: ningún cambio entra a `main` con pruebas en rojo.
- Commits pequeños con Conventional Commits, fáciles de enlazar desde la revisión.

## ¿Qué podemos hacer mejor?

### Personas

Al cumplir todos los roles, el tiempo de documentación compitió con el de desarrollo; las tareas de documentación se dejaban para el final del sprint.

### Relaciones

La validación con el patrocinador se hizo solo en la revisión; conviene preparar la demostración con datos de Huancayo desde el inicio del sprint para recoger observaciones antes.

### Procesos

Las historias se cerraron al final del sprint y no de forma continua; el tablero no reflejaba el avance diario.

### Herramientas

Faltaba un entorno reproducible para la demostración; se resolvió con Docker Compose y datos de demostración (`python -m app.seed`).

### Acciones a realizar

| Acción | Responsable | Métrica de seguimiento |
|---|---|---|
| Reservar 1 hora diaria para documentación del sprint | Fernando Chaupis | Documentos del sprint listos 1 día antes de la revisión |
| Mover las tarjetas en Jira al terminar cada tarea | Fernando Chaupis | Tablero actualizado diariamente (100 % de días con movimiento) |
| Ensayar la demostración con datos demo antes de la revisión | Fernando Chaupis | Demostración sin fallos en vivo |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 15/09/2026 | Fernando Rodrigo Chaupis Espinoza | Retrospectiva del sprint |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Plantilla oficial de la consigna, enlaces a commits, enlace de retorno al README y nota de los campos completados en el Sprint 4 |

[← Volver al README Principal](../../../README.md)
