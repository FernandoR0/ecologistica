[← Volver al README Principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

## ¿Qué aprendimos?

- OR-Tools necesita valores enteros: se trabaja en metros y décimas de kilogramo para no perder precisión.
- Una disyunción con penalización por prioridad evita que un solo pedido imposible deje sin solución todo el plan.
- La línea base (ruta secuencial) debe calcularse con las mismas paradas para que el ahorro sea comparable.

## ¿Qué estamos haciendo bien?

- Prototipar el motor como módulo puro (sin base de datos) permitió probarlo de forma aislada y rápida.
- Medir el rendimiento con un script reproducible en lugar de pruebas manuales.

## ¿Qué podemos hacer mejor?

### Personas

La curva de aprendizaje de OR-Tools consumió más horas de las previstas en la primera semana.

### Relaciones

Faltó mostrar resultados intermedios del motor al patrocinador; solo se vio el resultado final en la revisión.

### Procesos

La estimación de US-006 (13 SP) fue correcta, pero no se dividió en subtareas de 8 horas o menos en Jira.

### Herramientas

El mapa base de OpenStreetMap exige enviar el Referer del sitio; sin él los mosaicos se bloquean en algunos proxys.

### Acciones a realizar

| Acción | Responsable | Métrica de seguimiento |
|---|---|---|
| Dividir las historias de 8 SP o más en subtareas de 8 horas o menos | Fernando Chaupis | 0 subtareas mayores a 8 h en el Sprint 3 |
| Mostrar al patrocinador un avance a mitad de sprint | Fernando Chaupis | 1 demostración intermedia por sprint |
| Ejecutar la prueba de carga en cada cambio del motor | Fernando Chaupis | P95 ≤ 45 s registrado en cada cambio |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 29/09/2026 | Fernando Rodrigo Chaupis Espinoza | Retrospectiva del sprint |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Plantilla oficial de la consigna, enlaces a commits, enlace de retorno al README y nota de los campos completados en el Sprint 4 |

[← Volver al README Principal](../../../README.md)
