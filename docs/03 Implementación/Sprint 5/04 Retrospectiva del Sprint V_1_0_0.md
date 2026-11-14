# Retrospectiva del Sprint 5

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## ¿Qué aprendimos?

- La consigna pide una metaheurística específica (Algoritmo Genético, Búsqueda Tabú u Optimización por Colonia de Hormigas); el motor usaba Guided Local Search y se cambió a Búsqueda Tabú.
- Fijar versiones no basta: `pip-audit` y `npm audit` encontraron vulnerabilidades en PyJWT, Starlette y react-router.
- SonarQube analiza todo el repositorio si no se configura: los reportes HTML de evidencia generaban 56 hallazgos y 78 % de duplicación.
- En Windows las rutas de más de 260 caracteres fallan; se usa `core.longpaths` en git y el prefijo `\\?\` en los scripts.
- En YAML, un `:` seguido de espacio dentro de un comando rompe el workflow; hay que poner el comando entre comillas.

## ¿Qué estamos haciendo bien?

- Quality Gate de SonarQube aprobado con 0 cuestiones abiertas y 90.6 % de cobertura.
- Lighthouse 100 en la pantalla de inicio y 0 violaciones WCAG 2.1 AA en las 8 pantallas.
- 4 pruebas E2E y la prueba de carga (150 pedidos en 30 s) aprobadas.
- Inspección 04 completa con mediciones reales antes y después.

## ¿Qué podemos hacer mejor?

### Personas

La encuesta SUS depende de otras personas; hay que coordinarla con anticipación.

### Relaciones

Publicar el repositorio permite que el docente revise el código, los issues y el análisis de calidad sin pedir accesos.

### Procesos

Leer la consigna completa al inicio del proyecto y verificar cada requisito técnico, no solo los RF.

### Herramientas

Docker Desktop no levantó su motor en la máquina local; se usaron servicios en la nube (SonarQube Cloud, GitHub Actions).

## Acciones a realizar

| Acción | Eje | Responsable | Fecha |
|---|---|---|---|
| Aplicar la encuesta SUS a 5 usuarios | Personas | Fernando Rodrigo Chaupis Espinoza | Cierre |
| Bitácora de auditoría de acciones críticas (OWASP A09) | Herramientas | Fernando Rodrigo Chaupis Espinoza | Cierre |
| Revisar `pip-audit` y `npm audit` en cada sprint | Procesos | Fernando Rodrigo Chaupis Espinoza | Cierre |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
