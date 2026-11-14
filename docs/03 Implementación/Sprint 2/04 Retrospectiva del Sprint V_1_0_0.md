# Retrospectiva del Sprint 2

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## ¿Qué aprendimos?

- El VRPTW se modela en OR-Tools con dos dimensiones: capacidad (kg) y tiempo (viaje + servicio + espera).
- Un pedido imposible no debe tumbar todo el plan: con disyunciones y penalización por prioridad el motor lo informa como no asignado y planifica el resto.
- La distancia en línea recta subestima el recorrido real; se usa un factor vial de 1.3 configurable (supuesto S-02).
- Con el objetivo Green VRP (distancia × emisión relativa) el motor prefiere el vehículo eléctrico para los tramos largos.

## ¿Qué estamos haciendo bien?

- El motor quedó separado de la base de datos (`app/optimization`), así se prueba sin levantar la API.
- 11 pruebas del motor cubren capacidad, ventanas, jornada, pedidos imposibles y la preferencia por menos CO₂.
- Se completaron los 18 SP comprometidos (2 de 2 historias).

## ¿Qué podemos hacer mejor?

### Personas

Las historias del motor (13 SP) concentran el riesgo técnico del proyecto; hay que reservarles más tiempo que a los CRUD.

### Relaciones

Mostrar el plan en el mapa durante la revisión hace entendible el resultado para quien no conoce el algoritmo.

### Procesos

Medir el tiempo de cálculo con instancias grandes (150 pedidos) en el mismo sprint en que se construye el motor, no al final.

### Herramientas

Leaflet pesa 155 KB y se descargaba en todas las pantallas; hay que cargarlo solo en la pantalla Rutas.

## Acciones a realizar

| Acción | Eje | Responsable | Fecha |
|---|---|---|---|
| Prueba de carga con 150 pedidos y 15 vehículos | Procesos | Fernando Rodrigo Chaupis Espinoza | Sprint 5 |
| Cargar el mapa solo al abrir Rutas (lazy loading) | Herramientas | Fernando Rodrigo Chaupis Espinoza | Sprint 5 |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
