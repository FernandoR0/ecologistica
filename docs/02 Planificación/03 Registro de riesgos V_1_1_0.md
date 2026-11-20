[← Volver al README Principal](../../README.md)

# Registro de Riesgos

| Metadato | Valor |
|---|---|
| Nombre del Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. |
| Líder del Proyecto | Fernando Rodrigo Chaupis Espinoza |
| Fecha | 19/11/2026 |
| Versión | 1.1.0 |

---
## 1. Escalas y fórmula

**Severidad (Exposición) = Probabilidad (1 a 5) × Impacto (1 a 5)**

| Probabilidad | Impacto | Severidad |
|---|---|---|
| 1 Muy baja · 2 Baja · 3 Media · 4 Alta · 5 Muy alta | 1 Insignificante · 2 Menor · 3 Moderado · 4 Mayor · 5 Catastrófico | Low (1-6) · Medium (8-12) · High (15-25) |

## 2. Matriz de Evaluación de Riesgos

| ID | Descripción del Riesgo | Categoría | Prob. | Imp. | Severidad | Plan de Mitigación (Preventivo) | Plan de Contingencia (Reactivo) | Responsable |
|---|---|---|:-:|:-:|:-:|---|---|---|
| RSK-01 | El motor VRPTW no encuentra solución en 45 s para 150 pedidos y 15 vehículos. | Técnica / Rendimiento | 3 | 5 | 15 (High) | Construir el motor en el Sprint 2 con límite de tiempo configurable; script de carga 150/15 en el pipeline (ENB-002). | Reducir el vecindario de la Búsqueda Tabú y usar la mejor solución encontrada al llegar al límite; dividir la instancia por distrito. | Developer (motor) |
| RSK-02 | La distancia estimada (geodésica × 1,3) difiere de las calles reales y las horas de llegada salen imprecisas. | Técnica / Datos | 4 | 3 | 12 (Medium) | Calibrar el factor vial con 10 tramos medidos en OpenStreetMap; parámetro configurable. | Ampliar las ventanas con un margen de 10 min y registrar la demora real como incidente de tráfico. | Developer (motor) |
| RSK-03 | Un solo integrante no alcanza a cubrir todos los roles y el sprint se atrasa. | Recursos Humanos / Capacidades | 4 | 4 | 16 (High) | Backlog priorizado por valor; time-boxing diario de 3 h; automatizar pruebas y despliegue. | Mover historias de menor prioridad (Media) al siguiente sprint y usar la reserva de contingencia en horas extra. | Scrum Master |
| RSK-04 | Indisponibilidad o límites de los servicios gratuitos en la nube (Render, Vercel, SonarQube Cloud) durante una inspección. | Técnica / Infraestructura | 2 | 4 | 8 (Medium) | Monitorear los límites de cada plan; workflow de despliegue con verificación posterior; despertar la API antes de la demostración. | Levantar todo con `docker compose up` en local o en GitHub Codespaces y demostrar desde ahí. | DevOps (Developer) |
| RSK-05 | Vulnerabilidades en dependencias o en el código exponen datos personales (Ley N.º 29733). | Seguridad | 2 | 5 | 10 (Medium) | Dependencias bloqueadas por hash; `pip-audit` y `npm audit` en CI; SonarQube Cloud con Quality Gate. | Actualizar la dependencia afectada en ≤ 24 h, rotar el secreto JWT y revisar la auditoría de accesos. | Developer |
| RSK-06 | Curva de aprendizaje de OR-Tools (dimensiones, descansos, disyunciones). | Recursos Humanos / Capacidades | 3 | 3 | 9 (Medium) | Prototipo con los ejemplos oficiales de OR-Tools antes del Sprint 2; pruebas unitarias del motor. | Simplificar el modelo (descanso por post-proceso) y documentar la limitación. | Developer (motor) |
| RSK-07 | Cambios de alcance tras las inspecciones del docente generan re-trabajo. | Gestión / Alcance | 3 | 3 | 9 (Medium) | Revisar la consigna y la rúbrica antes de cada sprint; criterios de aceptación aprobados en la planificación. | Registrar el cambio con nueva versión del documento y re-priorizar el backlog en Jira. | Product Owner |
| RSK-08 | Los usuarios de la encuesta SUS no están disponibles a tiempo. | Gestión / Interesados | 3 | 2 | 6 (Low) | Convocar a 5 o más participantes una semana antes; encuesta dentro de la aplicación desplegada. | Ampliar el plazo de la encuesta y documentar la muestra efectiva. | Product Owner |
| RSK-09 | Pérdida de información por fallo del equipo local. | Técnica / Infraestructura | 2 | 3 | 6 (Low) | Todo el trabajo en GitHub con push diario; documentación en el repositorio. | Clonar el repositorio en otra máquina o en Codespaces. | Developer |

## 3. Resumen por Nivel de Severidad

| Nivel | Cantidad | Riesgos |
|---|:-:|---|
| High (15-25) | 2 | RSK-01, RSK-03 |
| Medium (8-12) | 5 | RSK-02, RSK-04, RSK-05, RSK-06, RSK-07 |
| Low (1-6) | 2 | RSK-08, RSK-09 |

La reserva de contingencia del presupuesto (12 %) cubre principalmente RSK-01 y RSK-03.

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 15/09/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial con 9 riesgos |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Cambio de alcance del Sprint 4 (enunciado oficial del caso): escalas de probabilidad e impacto y riesgos de despliegue revisados |

[← Volver al README Principal](../../README.md)
