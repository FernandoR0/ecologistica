# Retrospectiva del Sprint 4

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## ¿Qué aprendimos?

- El ahorro se mide contra una línea base: las mismas paradas recorridas en el orden de registro, sin optimizar.
- Los factores de emisión deben tener fuente (IPCC para combustibles y MINAM para la red eléctrica).
- Los indicadores se calculan sobre rutas vigentes; las re-optimizadas no se cuentan dos veces.

## ¿Qué estamos haciendo bien?

- El dashboard y el reporte usan los mismos servicios que prueban las pruebas de integración.
- El plan de compensación propone dos opciones (árboles y bonos) con sus supuestos visibles.
- Se completaron los 13 SP comprometidos (3 de 3 historias).

## ¿Qué podemos hacer mejor?

### Personas

Las historias de reportes son más cortas; el tiempo libre se puede usar para pruebas y documentación.

### Relaciones

Los indicadores ayudan a explicar el valor del sistema a la gerencia; conviene mostrarlos primero en la revisión.

### Procesos

Registrar en el control de cambios cada ajuste de alcance que salga de la revisión.

### Herramientas

Los indicadores se recalculaban en cada consulta; hace falta caché en el servidor.

## Acciones a realizar

| Acción | Eje | Responsable | Fecha |
|---|---|---|---|
| Caché de indicadores en el servidor que se limpia con cada escritura | Herramientas | Fernando Rodrigo Chaupis Espinoza | Sprint 5 |
| Mantener actualizado el control de cambios | Procesos | Fernando Rodrigo Chaupis Espinoza | Sprint 5 |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
