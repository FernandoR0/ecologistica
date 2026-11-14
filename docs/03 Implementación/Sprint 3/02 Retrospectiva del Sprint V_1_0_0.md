# Retrospectiva del Sprint 3

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## ¿Qué aprendimos?

- Para re-optimizar desde la posición actual del vehículo se necesita un nodo de origen distinto del depósito en el modelo de OR-Tools.
- La ventana efectiva de un pedido es la intersección entre su ventana y la preferencia del cliente para ese día.
- Ante una avería solo deben recibir paradas los vehículos que no tienen otra ruta vigente ese día.
- La jornada del conductor se controla con el límite de duración de la ruta de cada vehículo.

## ¿Qué estamos haciendo bien?

- La ruta original queda en estado REOPTIMIZADA y la nueva guarda el enlace a ella: se conserva la trazabilidad.
- Cada regla tiene su prueba (`test_jornada_maxima_del_conductor`, `test_preferencia_restringe_ventana`, `test_averia_reparte_en_otro_vehiculo`).
- Se completaron los 18 SP comprometidos (3 de 3 historias).

## ¿Qué podemos hacer mejor?

### Personas

La re-optimización (8 SP) tiene muchos casos; conviene dividirla por tipo de incidente para estimar mejor.

### Relaciones

Los incidentes se entienden mejor con un ejemplo en vivo (tráfico con 30 minutos de demora) que con la explicación del algoritmo.

### Procesos

Probar los incidentes también en el navegador (E2E), no solo en la API.

### Herramientas

El mapa dibuja la ruta re-optimizada desde el depósito y no desde la última entrega (defecto DEF-03).

## Acciones a realizar

| Acción | Eje | Responsable | Fecha |
|---|---|---|---|
| Prueba E2E de re-optimización por tráfico | Procesos | Fernando Rodrigo Chaupis Espinoza | Sprint 5 |
| Corregir el trazo de la ruta re-optimizada en el mapa (DEF-03) | Herramientas | Fernando Rodrigo Chaupis Espinoza | Cierre |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
