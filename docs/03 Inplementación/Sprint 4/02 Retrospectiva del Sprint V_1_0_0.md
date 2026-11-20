[← Volver al README Principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza

## ¿Qué aprendimos?

- **Técnicas:** OR-Tools interpreta una lista vacía en `SetAllowedVehiclesForIndex` como "todos los vehículos"; para
  prohibir un pedido a toda la flota hay que restringir la variable de vehículo a `-1`.
- **Técnicas:** el tiempo de cada tramo debe simularse con el perfil horario (hora punta) después de resolver; si se
  mide en minutos enteros, los tramos cortos parecen congestionados.
- **Arquitectura:** separar el motor (módulo puro) de la base de datos permitió agregar volumen, descansos y zonas sin
  tocar los routers, y probarlo con 22 pruebas unitarias.
- **Pruebas:** WebKit en Windows no graba video cuando la ruta supera 260 caracteres y `vite preview` escucha solo en
  IPv6; ambos se resolvieron en la configuración de Playwright.
- **Gestión:** revisar el enunciado oficial al inicio de cada sprint evita cambios de alcance tardíos.
- **Usabilidad:** las pruebas automáticas no detectan lo que confunde a una persona. Un robot escribe coordenadas o un
  horario de 24 horas sin problema; los participantes del SUS se detuvieron justo ahí. Probar con usuarios reales
  antes del cierre permitió corregir seis cuellos de botella el mismo día.
- **Calidad de flujos:** revisar cada flujo de punta a punta (crear, generar, cancelar, desactivar) encontró estados
  inconsistentes, como un pedido cancelado que seguía en su ruta, que las pruebas por pantalla no veían.

## ¿Qué estamos haciendo bien?

- Cada criterio Gherkin tiene una prueba automática: 76 de backend (cobertura 95 %), 104 de frontend (99 %) y 28 E2E
  por navegador.
- Integración por Pull Request con CI, Tests y SonarQube antes del merge.
- Medir con datos reales (Web Vitals, tiempos de API, sondeos) en lugar de declarar el rendimiento.
- Mensajes de error pensados para el usuario final (sin conexión, servicio no disponible).

## ¿Qué podemos hacer mejor?

### Personas

El sprint de tres semanas concentró 36 SP más el cambio de alcance; la carga diaria superó lo planificado y la
documentación quedó para el último día.

### Relaciones

La convocatoria de participantes para la encuesta SUS empezó tarde; debió coordinarse una semana antes con los
usuarios disponibles.

### Procesos

El cambio de alcance se detectó dentro del sprint; debe pasar por la planificación con su propia estimación en Jira
para no desplazar historias comprometidas.

### Herramientas

El despliegue depende de cuentas externas (Render y Vercel) que debieron prepararse al inicio del sprint, no al final.

### Acciones a realizar

| Acción | Responsable | Métrica de seguimiento | Fecha |
|---|---|---|---|
| Revisar enunciado, consigna y rúbrica al planificar el cierre | Fernando Chaupis | 0 requisitos descubiertos después de planificar | 21/11/2026 |
| Completar la encuesta SUS con 5 o más participantes | Fernando Chaupis | n ≥ 5 respuestas registradas en la aplicación (cumplida: n = 5, SUS 84,5) | 20/11/2026 |
| Repetir el SUS con 3 nuevos planificadores sobre la versión con límites de flota y formato de hora | Fernando Chaupis | Promedio del perfil Planificador ≥ 80 (hoy 78,3) | 03/12/2026 |
| Mantener verdes los 3 workflows en `main` | Fernando Chaupis | 100 % de ejecuciones en verde por semana | Hasta el 04/12/2026 |
| Revisar el monitoreo de producción cada 6 horas | Fernando Chaupis | Disponibilidad ≥ 99,5 % en el historial de `tests.yml` | Hasta el 04/12/2026 |
| Documentar el avance diario en Jira | Fernando Chaupis | Tablero actualizado todos los días del periodo de cierre | Hasta el 04/12/2026 |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 20/11/2026 | Fernando Rodrigo Chaupis Espinoza | Retrospectiva del Sprint 4, con los aprendizajes de la prueba de usabilidad |

[← Volver al README Principal](../../../README.md)
