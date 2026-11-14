# Retrospectiva del Sprint 1

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## ¿Qué aprendimos?

- bcrypt solo admite contraseñas de hasta 72 bytes; se limitó la contraseña a 72 caracteres en la validación para no devolver un error 500.
- Validar en la API que las coordenadas estén dentro del Valle del Mantaro evita pedidos que luego no se pueden planificar.
- Las bajas lógicas (vehículos y conductores inactivos, pedidos cancelados) conservan el historial de rutas.
- Responder 409 (duplicado) y 422 (dato inválido) con mensajes claros facilita escribir los criterios Gherkin como pruebas.

## ¿Qué estamos haciendo bien?

- Cada historia se construyó completa: modelo, API, pantalla y prueba automática.
- Los secretos quedan fuera del repositorio (`.env` en `.gitignore`, solo `.env.example`).
- Se completaron los 16 SP comprometidos (4 de 4 historias).

## ¿Qué podemos hacer mejor?

### Personas

Al ser un proyecto individual, todo el camino crítico depende de una sola persona. Conviene empezar cada sprint por la historia de mayor valor para que el incremento sea demostrable aunque falte tiempo.

### Relaciones

La validación depende de la revisión con el docente. Hay que llegar con datos de demostración cargados para mostrar el flujo completo sin preparar nada en vivo.

### Procesos

Escribir el criterio de aceptación en Gherkin antes del código y convertirlo en prueba antes de cerrar el issue.

### Herramientas

El CI todavía no revisa seguridad ni calidad (solo lint y pruebas).

## Acciones a realizar

| Acción | Eje | Responsable | Fecha |
|---|---|---|---|
| Convertir cada criterio Gherkin en una prueba automática antes de cerrar el issue | Procesos | Fernando Rodrigo Chaupis Espinoza | Sprint 2 |
| Mantener `python -m app.seed` con datos demo para las revisiones | Relaciones | Fernando Rodrigo Chaupis Espinoza | Sprint 2 |
| Agregar análisis de calidad y seguridad al CI | Herramientas | Fernando Rodrigo Chaupis Espinoza | Sprint 5 |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
