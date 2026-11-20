[← Volver al README Principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Chaupis Espinoza, Fernando Rodrigo

| Campo | Detalle |
|---|---|
| Sprint | Sprint 4 - Indicadores, calidad, despliegue y validación con usuarios (30/10/2026 - 19/11/2026) |
| Sprint Goal | Medir el impacto, liberar en producción y validar con usuarios: indicadores, reportes, modo conductor, Green IT, E2E, SUS y despliegue continuo |
| Incremento revisado | Aplicación 1.1.0, rama `feature/enunciado-oficial` integrada por [FernandoR0/ecologistica#20](https://github.com/FernandoR0/ecologistica/pull/20) |
| Versión del documento | V_1_0_0 · 19/11/2026 |

## Historias de Usuario completadas en este Sprint

Definition of Done aplicada: criterios Gherkin cubiertos por pruebas automáticas, cobertura ≥ 80 %, Quality Gate
PASSED, 0 violaciones WCAG 2.1 AA, Pull Request con CI en verde y documentación de la API en `/docs`.

| Código | Título | Criterios de aceptación verificados | Pull Request / commit de cierre | Estado |
|---|---|---|---|---|
| US-011 | Consultar el dashboard de sostenibilidad | Seis indicadores (km, CO₂, combustible ahorrado en L y S/, ventanas, ahorro frente a la ruta secuencial, árboles) y la frase "Has ahorrado S/ XX en combustible hoy"; sin rutas muestra "Aún no hay rutas planificadas" | [af5e453](https://github.com/FernandoR0/ecologistica/commit/af5e453) · [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) · [#20](https://github.com/FernandoR0/ecologistica/pull/20) | Done |
| US-012 | Descargar el reporte de sostenibilidad | PDF con emisiones por ruta, costo del ciclo de vida (combustible, mantenimiento S/ 1,20/km, depreciación 20 %, seguros), créditos de carbono y meta de cero neto; rango inválido responde 422 | [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) · [#20](https://github.com/FernandoR0/ecologistica/pull/20) | Done |
| US-013 | Planificar la compensación de carbono | CO₂ pendiente, árboles necesarios y costo de bonos; el registro de reforestación descuenta el pendiente; CO₂ ≤ 0 rechazado | [af5e453](https://github.com/FernandoR0/ecologistica/commit/af5e453) · [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) | Done |
| US-014 | Consultar mi ruta en modo conductor | El conductor ve su siguiente entrega con dirección, referencia, hora y alerta de tráfico; "Entregado" marca la parada y resalta la siguiente | [80e4054](https://github.com/FernandoR0/ecologistica/commit/80e4054) · [#20](https://github.com/FernandoR0/ecologistica/pull/20) | Done |
| US-015 | Administrar usuarios, parámetros y auditoría | Cambios de parámetros aplicados al siguiente plan y auditados; el auditor exporta la bitácora en CSV; el ADMIN no puede desactivarse (409) | [af5e453](https://github.com/FernandoR0/ecologistica/commit/af5e453) · [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) | Done |
| US-010 | Aplicar restricciones locales de circulación (pasó del Sprint 3) | Pedidos del Centro solo para vehículos permitidos; regla de placa del día; tramos por zonas de riesgo penalizados | [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) | Done |
| US-008 | Descanso de 1 h cada 4 h (parte pendiente del Sprint 3) | Ruta de más de 4 h con 60 min de descanso y llegadas recalculadas | [fabf1ca](https://github.com/FernandoR0/ecologistica/commit/fabf1ca) | Done |
| ENB-004 | Reducción del impacto ambiental del software (Inspección 04) | 8 optimizaciones con código antes y después; Lighthouse dentro de los 6 umbrales en escritorio; SWDM v4 | [2ab9ad9](https://github.com/FernandoR0/ecologistica/commit/2ab9ad9) · [edf5779](https://github.com/FernandoR0/ecologistica/commit/edf5779) · [aa231dc](https://github.com/FernandoR0/ecologistica/commit/aa231dc) | Done |
| ENB-005 | Pruebas E2E y monitoreo con Playwright | 75/75 en Chromium, Firefox y WebKit; APIs < 500 ms; resiliencia ante caída de red, 503 y lentitud | [1bae7bc](https://github.com/FernandoR0/ecologistica/commit/1bae7bc) · [#20](https://github.com/FernandoR0/ecologistica/pull/20) | Done |
| ENB-006 | Despliegue continuo a producción | `ci.yml`, `tests.yml` y `deploy-production.yml` con credenciales en GitHub Secrets; web en [ecologistica.vercel.app](https://ecologistica.vercel.app) y API en Render con PostgreSQL 16; 36/36 pruebas `@public` contra producción | [1c87a56](https://github.com/FernandoR0/ecologistica/commit/1c87a56) · [#20](https://github.com/FernandoR0/ecologistica/pull/20) | Done |

**Cambio de alcance aprobado en el sprint:** al contrastar el backlog con el enunciado oficial del caso se
incorporaron los campos que faltaban (volumen, año y factor de emisión del vehículo; categoría de licencia,
experiencia y disponibilidad del conductor; prioridad express/estándar/económico y tipo de producto del pedido), el
módulo de clientes como entidad propia, el rol AUDITOR y el bloqueo a los 3 intentos. Los documentos de inicio y
planificación afectados se versionaron.

## Demostración del trabajo completado

Demostración a los stakeholders de las funcionalidades implementadas.

| Momento | Funcionalidad exhibida | Entorno | Evidencia |
|---|---|---|---|
| 1 | Acceso por rol (planificador, conductor, auditor) y bloqueo al tercer intento | Build de producción con la API real (entorno de pruebas E2E) | Casos 1-6 del [análisis Playwright](<03 Analisis PlayWrigth V_1_0_0.md>) |
| 2 | Registro de cliente y pedido que hereda horario y punto de referencia | Mismo entorno | Caso 8 |
| 3 | Plan con Búsqueda Tabú, mapa con tramos por congestión, zonas y descanso del conductor | Mismo entorno | Caso 11 y [reporte HTML](evidencias/local-20261119/reporte-html.png) |
| 4 | Accidente en Av. Ferrocarril y re-optimización con trazabilidad del incidente | Mismo entorno | Caso 12 |
| 5 | Dashboard, reporte PDF con costo del ciclo de vida y plan de compensación | Mismo entorno | Caso 13 |
| 6 | Modo conductor en celular: siguiente entrega y "Entregado" | Mismo entorno | Caso 14 |
| 7 | Pipelines en GitHub Actions: CI, Tests (3 navegadores) y despliegue | GitHub Actions | [Actions del repositorio](https://github.com/FernandoR0/ecologistica/actions) |
| 8 | Aplicación publicada: acceso, disponibilidad y tiempos de carga | Producción ([ecologistica.vercel.app](https://ecologistica.vercel.app)) | Sección 5.5 del [análisis Playwright](<03 Analisis PlayWrigth V_1_0_0.md>) |

Retroalimentación registrada: mantener la evidencia de cada criterio enlazada a su prueba automática y validar la
usabilidad con usuarios reales (ver Pendientes).

## Pendientes

| Ítem | Estado | Justificación y tratamiento |
|---|---|---|
| ENB-007 Evaluación de usabilidad SUS | En curso | La encuesta ya está dentro de la aplicación (pantalla "Encuesta SUS"); los resultados se documentan en [04 Usabilidad](<04 Usabilidad V_1_0_0.md>) al completar la muestra de 5 o más participantes. |
| Tráfico en tiempo real (Waze for Cities / Google Maps) | Deuda técnica | Requiere convenio o pago; se usa un perfil horario de hora punta (RN-011). Se mantiene en el backlog para una versión futura. |
| Límites distritales simplificados | Deuda técnica | Polígonos de OpenStreetMap simplificados para el mapa; suficientes para la visualización, no para cálculos catastrales. |
| Arranque en frío del plan gratuito de la API | Deuda técnica | La primera petición tras inactividad tarda más; el monitoreo cada 6 horas y la verificación posterior al despliegue despiertan la API. |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Revisión del Sprint 4 |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | URL de producción y resultados de las pruebas contra el entorno desplegado |

[← Volver al README Principal](../../../README.md)
