[← Volver al README Principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

## Historias de Usuario completadas en este Sprint

| Código | Título | Criterios de aceptación verificados | Pull Request / commit de cierre | Estado |
|---|---|---|---|---|
| US-008 | Respetar jornada y descansos del conductor | Ninguna ruta supera la jornada máxima del conductor (480 min); los pedidos que la exceden quedan sin asignar | [3b1724c](https://github.com/FernandoR0/ecologistica/commit/3b1724c) | Done (jornada); el descanso de 1 h cada 4 h pasó al Sprint 4 |
| US-009 | Re-optimizar ante incidentes | Tráfico, bloqueo, clima y avería generan una nueva versión de la ruta desde la última entrega; la avería reparte las paradas en otros vehículos | [3b1724c](https://github.com/FernandoR0/ecologistica/commit/3b1724c) · [af5e453 (pedido nuevo y cancelación)](https://github.com/FernandoR0/ecologistica/commit/af5e453) | Done |
| ENB-003 | Auditoría de calidad, seguridad y accesibilidad | Quality Gate PASSED con cobertura ≥ 80 %, OWASP Top 10 2025 revisado y 0 violaciones WCAG 2.1 AA (ver documentos 03, 04 y 05) | [c1418b7](https://github.com/FernandoR0/ecologistica/commit/c1418b7) · [65b250a (correcciones Sonar)](https://github.com/FernandoR0/ecologistica/commit/65b250a) | Done |

**Story points completados:** 13 de 23 (US-008 parcial y US-010 pendiente; ver Pendientes).

## Demostración del trabajo completado

Demostración a los stakeholders de las funcionalidades implementadas.

- Entorno: ejecución local con datos de demostración y panel público de SonarQube Cloud.
- Se mostró un plan donde los pedidos que exceden la jornada quedan sin asignar, el registro de un incidente de tráfico con 30 minutos de demora y la nueva versión de la ruta desde la última entrega, y una avería que reparte las paradas en otro vehículo.
- Se presentó el Quality Gate de SonarQube Cloud antes y después de las correcciones, la matriz OWASP Top 10 2025 y la auditoría WCAG con axe-core.
- Evidencias: ![Ruta re-optimizada](<../../06 Anexos/evidencias/e2e-08-ruta-reoptimizada.png>) ![SonarQube después](<../../06 Anexos/evidencias/sonarqube-despues-resumen.png>)

## Pendientes

- **US-010 Restricciones locales de circulación** (zona restringida del Centro, regla de placa y zonas de riesgo): no se alcanzó por el tiempo dedicado a corregir los hallazgos de SonarQube. Se pasó al Sprint 4 y se completó en el commit [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca).
- **Descanso obligatorio de 1 hora cada 4 horas** (parte de US-008): se pasó al Sprint 4 junto con US-010 (mismo commit).
- Retroalimentación: priorizar las restricciones del caso oficial antes de la Inspección 05.

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 29/10/2026 | Fernando Rodrigo Chaupis Espinoza | Revisión del Sprint 3 |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Ubicación oficial `Sprint 03`, plantilla de la consigna y enlace de retorno al README |

[← Volver al README Principal](../../../README.md)
