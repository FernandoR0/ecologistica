[← Volver al README Principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

## ¿Qué aprendimos?

- Analizar con SonarQube desde el primer sprint habría evitado acumular 19 hallazgos de seguridad en workflows y Dockerfiles.
- Los reportes HTML guardados como evidencia deben excluirse del análisis (`sonar.exclusions`) para no distorsionar la duplicación.
- Re-optimizar desde la última entrega exige separar las paradas completadas de las pendientes antes de llamar al motor.
- La avería de un vehículo solo puede repartirse en vehículos que no tengan otra ruta vigente ese día.

## ¿Qué estamos haciendo bien?

- Bloquear dependencias por hash y fijar acciones de GitHub por SHA: el Quality Gate quedó en verde sin excepciones.
- Mantener la cobertura por encima del 80 % en cada cambio.
- Auditar la accesibilidad con axe-core sobre las pantallas reales, no solo con Lighthouse.

## ¿Qué podemos hacer mejor?

### Personas

La estimación de ENB-003 (5 SP) no consideró la curva de aprendizaje de las reglas de SonarQube; consumió horas previstas para US-010.

### Relaciones

Faltó contrastar el backlog con el enunciado oficial del caso antes de planificar el sprint; algunas restricciones locales se descubrieron tarde.

### Procesos

Los hallazgos de calidad se atendieron al final del sprint; deben revisarse en cada Pull Request.

### Herramientas

El análisis de SonarQube solo corría en `main`; conviene ejecutarlo también en los Pull Request para ver el Quality Gate antes del merge.

### Acciones a realizar

| Acción | Responsable | Métrica de seguimiento |
|---|---|---|
| Revisar la consigna y el enunciado oficial al planificar cada sprint | Fernando Chaupis | 0 requisitos del enunciado descubiertos después de planificar |
| Integrar cada historia por Pull Request con CI y Sonar en verde | Fernando Chaupis | 100 % de historias del Sprint 4 con PR enlazado |
| Reservar 20 % de la capacidad del sprint para deuda técnica | Fernando Chaupis | Deuda técnica de SonarQube = 0 al cerrar el sprint |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 29/10/2026 | Fernando Rodrigo Chaupis Espinoza | Retrospectiva del Sprint 3 |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Ubicación oficial `Sprint 03`, plantilla de la consigna y enlace de retorno al README |

[← Volver al README Principal](../../../README.md)
