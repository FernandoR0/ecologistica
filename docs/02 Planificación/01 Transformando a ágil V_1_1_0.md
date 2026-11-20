[← Volver al README Principal](../../README.md)

# Transformando a Ágil

| Metadato | Valor |
|---|---|
| Nombre del Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. |
| Líder del Proyecto | Fernando Rodrigo Chaupis Espinoza |
| Herramienta ALM | Atlassian Jira Software (proyecto Scrum, clave ECO) |
| Fecha | 19/11/2026 |
| Versión | 1.1.0 |

---
## A. Metodología de Transformación

1. **RF → Épicas → Historias de Usuario.** Cada requisito funcional de `06. Requisitos funcionales` se agrupa en una
   épica por bloque de negocio y se descompone en historias que entregan valor por sí solas en un sprint.
2. **RNF → Historias Técnicas (Enablers) o DoD.** Los RNF que exigen trabajo propio (pipeline, pruebas de rendimiento,
   despliegue, auditoría de calidad) se convierten en enablers; los transversales (seguridad, accesibilidad, cobertura)
   se exigen en la Definition of Done.
3. **Estimación:** Story Points con la serie de Fibonacci (1, 2, 3, 5, 8, 13) por comparación con US-002 (3 SP) como
   historia de referencia.
4. **Priorización:** valor de negocio y riesgo técnico; el motor de rutas (mayor riesgo) se construye en el Sprint 2.

### Mapa RF / RNF → Épicas → Historias

| Épica | Nombre | Requisitos | Historias y enablers |
|---|---|---|---|
| EP-01 | Gestión operativa e identidad | RF-001, RF-002, RF-008, RF-009, RF-011 | US-001, US-002, US-003, US-004, US-005 |
| EP-02 | Motor de rutas y operación en campo | RF-003, RF-004, RF-007 | US-006, US-007, US-008, US-009, US-010 |
| EP-03 | Sostenibilidad e indicadores | RF-005, RF-006, RF-010 | US-011, US-012, US-013 |
| EP-04 | Administración, calidad y despliegue | RF-011, RF-012, RNF-001 a RNF-012 | US-014, US-015, ENB-001 a ENB-007 |

| RNF | Tratamiento |
|---|---|
| RNF-001, RNF-002 (rendimiento del motor) | ENB-002 |
| RNF-003, RNF-006 (latencia y disponibilidad) | ENB-005 |
| RNF-004, RNF-005, RNF-007, RNF-010 (seguridad, accesibilidad, mantenibilidad) | ENB-003 y DoD |
| RNF-008 (usabilidad) | ENB-007 |
| RNF-009, RNF-011 (escalabilidad, despliegue) | ENB-001, ENB-006 |
| RNF-012 (eco-diseño) | ENB-004 |

## B. Historias de Usuario

### US-001

**ID:** US-001 · **Título:** Iniciar sesión según mi rol · **Épica Relacionada:** EP-01 Gestión operativa e identidad ·
**Requisito:** RF-011 · **Story Points:** 5 · **Sprint:** 1

**Redacción:** **Como** usuario de DistriRápido, **quiero** iniciar sesión con mi correo y contraseña y ver solo las
opciones de mi rol, **para** proteger la información de la empresa.

**Criterios de aceptación:**

```gherkin
Escenario: Acceso correcto de un planificador
  Dado un usuario activo con rol PLANIFICADOR
  Cuando ingresa su correo y contraseña correctos
  Entonces el sistema abre el Dashboard con el menú de planificador

Escenario: Bloqueo por intentos fallidos
  Dado un usuario que ya falló 2 veces la contraseña
  Cuando la vuelve a ingresar mal
  Entonces el sistema bloquea la cuenta 15 minutos y responde 423
```

### US-002

**ID:** US-002 · **Título:** Gestionar la flota de vehículos · **Épica Relacionada:** EP-01 · **Requisito:** RF-001 ·
**Story Points:** 3 · **Sprint:** 1

**Redacción:** **Como** planificador, **quiero** registrar y actualizar los vehículos con su capacidad, combustible,
rendimiento y año, **para** planificar con datos reales de carga y emisiones.

```gherkin
Escenario: Registro de un vehículo válido
  Dado un planificador autenticado en la pantalla Flota
  Cuando registra la placa "ABC-101", camioneta, 1500 kg, 8 m3, diésel, 9 km/L y año 2018
  Entonces el vehículo queda activo con factor de emisión 0,298 kg CO2/km

Escenario: Placa duplicada
  Dado un vehículo con placa "ABC-101"
  Cuando se registra otro vehículo con la misma placa
  Entonces el sistema responde 409 con el mensaje "La placa ya está registrada"
```

### US-003

**ID:** US-003 · **Título:** Gestionar conductores · **Épica Relacionada:** EP-01 · **Requisito:** RF-008 ·
**Story Points:** 3 · **Sprint:** 1

**Redacción:** **Como** planificador, **quiero** registrar a los conductores con su licencia, experiencia,
disponibilidad y punto de partida, **para** asignarlos a rutas que respeten su jornada.

```gherkin
Escenario: Registro de un conductor
  Dado un planificador autenticado
  Cuando registra un conductor con DNI de 8 dígitos, licencia A-IIb y disponibilidad 07:00-16:00
  Entonces el conductor queda activo y disponible para asignarle un vehículo

Escenario: Licencia que no corresponde al vehículo
  Dado un conductor con licencia B-IIc
  Cuando el planificador le asigna un furgón
  Entonces el sistema rechaza la asignación con el mensaje de categoría no válida
```

### US-004

**ID:** US-004 · **Título:** Registrar clientes y sus preferencias · **Épica Relacionada:** EP-01 ·
**Requisito:** RF-009 · **Story Points:** 3 · **Sprint:** 1

**Redacción:** **Como** planificador, **quiero** registrar a cada cliente con su horario preferido, punto de referencia
y restricciones de acceso, **para** que sus pedidos se entreguen cuando pueden recibirlos.

```gherkin
Escenario: Cliente con horario preferido
  Dado un planificador autenticado
  Cuando registra "Restaurante Wanka" con horario 08:00-11:00 de lunes a sábado
  Entonces el sistema propone 08:00-11:00 como ventana al crear sus pedidos

Escenario: Horario fuera del rango operativo
  Dado el formulario de cliente
  Cuando el horario termina antes de empezar o sale de 05:00-22:00
  Entonces el sistema rechaza el registro con "Horario fuera del rango operativo"
```

### US-005

**ID:** US-005 · **Título:** Registrar pedidos · **Épica Relacionada:** EP-01 · **Requisito:** RF-002 ·
**Story Points:** 5 · **Sprint:** 1

**Redacción:** **Como** planificador, **quiero** registrar pedidos con ubicación, peso, volumen, ventana, prioridad y
tipo de producto, **para** que el motor los pueda planificar.

```gherkin
Escenario: Pedido válido
  Dado el cliente "Bodega Santa Isabel" registrado
  Cuando el planificador registra 80 kg, 0,4 m3, ventana 09:00-12:00, prioridad express y producto perecedero
  Entonces el pedido queda PENDIENTE con código único y aparece en la primera página del listado

Escenario: Ventana inválida
  Dado el formulario de pedido
  Cuando la hora de fin es anterior a la de inicio
  Entonces el sistema responde 422 y no crea el pedido
```

### US-006

**ID:** US-006 · **Título:** Generar rutas optimizadas · **Épica Relacionada:** EP-02 Motor de rutas y operación en
campo · **Requisito:** RF-003 · **Story Points:** 13 · **Sprint:** 2

**Redacción:** **Como** planificador, **quiero** generar con un clic las rutas de todos los vehículos con Búsqueda
Tabú, **para** recorrer menos kilómetros, gastar menos combustible y emitir menos CO₂.

```gherkin
Escenario: Plan factible
  Dado 20 pedidos pendientes y 3 vehículos con conductor
  Cuando el planificador pulsa "Generar rutas optimizadas"
  Entonces el sistema devuelve en 45 s o menos un plan sin exceso de capacidad ni de jornada
  Y muestra el ahorro de km y CO2 frente a la ruta secuencial

Escenario: Pedidos que no caben
  Dado pedidos que superan la capacidad de la flota
  Cuando se generan las rutas
  Entonces el sistema planifica primero los express y perecederos e informa los pedidos sin asignar
```

### US-007

**ID:** US-007 · **Título:** Ver las rutas en el mapa · **Épica Relacionada:** EP-02 · **Requisito:** RF-004 ·
**Story Points:** 5 · **Sprint:** 2

**Redacción:** **Como** planificador, **quiero** ver cada ruta en el mapa con sus paradas numeradas, el tiempo de cada
tramo y su congestión, **para** revisar el plan antes de despachar.

```gherkin
Escenario: Rutas dibujadas
  Dado un plan generado
  Cuando el planificador abre la pantalla Rutas
  Entonces cada ruta aparece con un color, paradas numeradas y tramos verde, amarillo o rojo

Escenario: Detalle de un tramo
  Dado una ruta en el mapa
  Cuando el usuario selecciona un tramo
  Entonces el sistema muestra su distancia, tiempo estimado y nivel de congestión
```

### US-008

**ID:** US-008 · **Título:** Respetar jornada y descansos del conductor · **Épica Relacionada:** EP-02 ·
**Requisito:** RF-003, RF-008 · **Story Points:** 5 · **Sprint:** 3

**Redacción:** **Como** conductor, **quiero** que mi ruta no supere mi jornada y tenga mis descansos obligatorios,
**para** trabajar dentro de la ley y sin fatiga.

```gherkin
Escenario: Descanso insertado
  Dado una ruta de más de 4 horas de conducción
  Cuando el motor la construye
  Entonces inserta un descanso de 60 minutos y recalcula las llegadas siguientes

Escenario: Jornada máxima
  Dado un conductor con jornada máxima de 480 minutos
  Cuando se genera el plan
  Entonces ninguna ruta de ese conductor dura más de 480 minutos
```

### US-009

**ID:** US-009 · **Título:** Re-optimizar ante incidentes · **Épica Relacionada:** EP-02 · **Requisito:** RF-007 ·
**Story Points:** 8 · **Sprint:** 3

**Redacción:** **Como** planificador, **quiero** recalcular una ruta en curso cuando hay tráfico, un accidente, una
avería, un pedido nuevo o una cancelación, **para** seguir cumpliendo los horarios.

```gherkin
Escenario: Accidente con demora
  Dado una ruta en curso con 3 paradas completadas
  Cuando se registra un accidente con 30 minutos de demora a las 10:00
  Entonces el sistema genera en 30 s o menos una nueva versión con las paradas pendientes

Escenario: Avería del vehículo
  Dado una avería en el vehículo de una ruta en curso
  Cuando el planificador la registra
  Entonces las paradas pendientes se reasignan a otros vehículos disponibles
```

### US-010

**ID:** US-010 · **Título:** Aplicar restricciones locales de circulación · **Épica Relacionada:** EP-02 ·
**Requisito:** RF-003, RF-004 · **Story Points:** 5 · **Sprint:** 3

**Redacción:** **Como** jefe de operaciones, **quiero** que el motor respete la zona restringida del Centro, la regla
de placa del día y penalice las zonas de riesgo, **para** cumplir las normas y proteger la carga.

```gherkin
Escenario: Zona restringida
  Dado un pedido dentro del Centro de Huancayo y una camioneta diésel de 2008
  Cuando se generan las rutas
  Entonces ese pedido se asigna a otro vehículo permitido o queda sin asignar

Escenario: Regla de placa
  Dado que el administrador restringe el dígito 3 los lunes
  Cuando se generan las rutas un lunes
  Entonces los vehículos con placa terminada en 3 no reciben ruta
```

### US-011

**ID:** US-011 · **Título:** Consultar el dashboard de sostenibilidad · **Épica Relacionada:** EP-03 Sostenibilidad e
indicadores · **Requisito:** RF-005 · **Story Points:** 5 · **Sprint:** 4

**Redacción:** **Como** jefe de operaciones, **quiero** ver km, CO₂, combustible ahorrado en soles, cumplimiento de
ventanas, ahorro frente a la ruta secuencial y árboles equivalentes, **para** medir el impacto del sistema.

```gherkin
Escenario: Indicadores del día
  Dado rutas planificadas hoy
  Cuando abro el Dashboard
  Entonces veo los seis indicadores y la frase "Has ahorrado S/ XX en combustible hoy"

Escenario: Sin rutas
  Dado que no hay rutas
  Cuando abro el Dashboard
  Entonces veo los indicadores en cero y el aviso "Aún no hay rutas planificadas"
```

### US-012

**ID:** US-012 · **Título:** Descargar el reporte de sostenibilidad · **Épica Relacionada:** EP-03 ·
**Requisito:** RF-006 · **Story Points:** 5 · **Sprint:** 4

**Redacción:** **Como** gerente, **quiero** descargar un PDF con el CO₂ por ruta, el costo del ciclo de vida de la flota
y los créditos de carbono, **para** decidir inversiones en la flota.

```gherkin
Escenario: Reporte del periodo
  Dado rutas completadas en el periodo
  Cuando pulso "Descargar reporte PDF"
  Entonces descargo un PDF con emisiones por ruta, costo del ciclo de vida, créditos de carbono y meta de cero neto

Escenario: Rango inválido
  Dado una fecha inicial posterior a la final
  Cuando solicito el reporte
  Entonces el sistema responde 422 "Rango de fechas inválido"
```

### US-013

**ID:** US-013 · **Título:** Planificar la compensación de carbono · **Épica Relacionada:** EP-03 ·
**Requisito:** RF-010 · **Story Points:** 3 · **Sprint:** 4

**Redacción:** **Como** auditor ambiental, **quiero** saber cuánto CO₂ falta compensar y cuántos árboles se necesitan,
**para** avanzar hacia la meta de carbono neutral.

```gherkin
Escenario: Plan calculado
  Dado 120 kg de CO2 emitidos
  Cuando abro Sostenibilidad
  Entonces veo el CO2 pendiente, los árboles necesarios y el costo de bonos

Escenario: Registro de compensación
  Dado el plan de compensación
  Cuando registro 10 árboles plantados con un programa de reforestación de Junín
  Entonces el CO2 pendiente disminuye en la cantidad registrada
```

### US-014

**ID:** US-014 · **Título:** Consultar mi ruta en modo conductor · **Épica Relacionada:** EP-04 Administración, calidad
y despliegue · **Requisito:** RF-011, RNF-008 · **Story Points:** 3 · **Sprint:** 4

**Redacción:** **Como** conductor, **quiero** ver solo mi ruta del día, mis entregas pendientes y las alertas en mi
celular, **para** saber a dónde ir sin depender del planificador.

```gherkin
Escenario: Ruta del día
  Dado un conductor con una ruta asignada
  Cuando inicia sesión en su celular
  Entonces ve la siguiente entrega resaltada con dirección, punto de referencia y hora estimada

Escenario: Marcar entrega
  Dado su siguiente entrega
  Cuando pulsa "Entregado"
  Entonces la parada queda ENTREGADA y se resalta la siguiente
```

### US-015

**ID:** US-015 · **Título:** Administrar usuarios, parámetros y auditoría · **Épica Relacionada:** EP-04 ·
**Requisito:** RF-012 · **Story Points:** 5 · **Sprint:** 4

**Redacción:** **Como** administrador, **quiero** gestionar usuarios, ajustar los parámetros del motor y revisar la
auditoría, **para** controlar quién hace qué en el sistema.

```gherkin
Escenario: Cambio de parámetro
  Dado un administrador autenticado
  Cuando cambia la velocidad urbana a 22 km/h
  Entonces el siguiente plan usa 22 km/h y el cambio queda en la auditoría

Escenario: Exportar auditoría
  Dado un auditor autenticado
  Cuando filtra la bitácora y pulsa "Exportar CSV"
  Entonces descarga un CSV con los eventos filtrados
```

## C. Historias Técnicas (Enablers)

### ENB-001

**ID:** ENB-001 · **Título:** Integración continua · **Épica Relacionada:** EP-04 · **Requisito:** RNF-010, RNF-011 ·
**Story Points:** 3 · **Sprint:** 1

**Redacción:** **Como** equipo de desarrollo, **necesitamos** un pipeline de GitHub Actions con lint, pruebas y build de
backend y frontend, **para** detectar errores en cada push.

```gherkin
Escenario: Push con pruebas en verde
  Dado un push a main o develop
  Cuando se ejecuta ci.yml
  Entonces lint, pruebas y build terminan en verde en 15 minutos o menos

Escenario: Prueba fallida
  Dado un cambio que rompe una prueba
  Cuando se ejecuta el pipeline
  Entonces el job falla y el commit queda marcado en rojo
```

### ENB-002

**ID:** ENB-002 · **Título:** Prueba de rendimiento del motor · **Épica Relacionada:** EP-02 · **Requisito:** RNF-001,
RNF-002 · **Story Points:** 3 · **Sprint:** 2

**Redacción:** **Como** equipo de desarrollo, **necesitamos** un script de carga con 150 pedidos y 15 vehículos,
**para** demostrar que el motor cumple 45 s.

```gherkin
Escenario: Instancia grande
  Dado 150 pedidos y 15 vehículos generados por el script
  Cuando se ejecuta el motor 5 veces
  Entonces el P95 del tiempo es 45 s o menos

Escenario: Re-optimización
  Dado una ruta en curso de la instancia grande
  Cuando se registra un incidente
  Entonces la re-optimización termina en 30 s o menos
```

### ENB-003

**ID:** ENB-003 · **Título:** Auditoría de calidad, seguridad y accesibilidad · **Épica Relacionada:** EP-04 ·
**Requisito:** RNF-004, RNF-005, RNF-007, RNF-010 · **Story Points:** 5 · **Sprint:** 3

**Redacción:** **Como** equipo de desarrollo, **necesitamos** analizar el código con SonarQube Cloud, revisar el OWASP
Top 10 2025 y auditar WCAG 2.1 AA, **para** entregar software seguro y accesible.

```gherkin
Escenario: Quality Gate
  Dado el análisis de SonarQube Cloud sobre main
  Cuando termina
  Entonces el Quality Gate está PASSED con cobertura de 80 % o más

Escenario: Accesibilidad
  Dado las 8 pantallas del sistema
  Cuando se auditan con axe-core
  Entonces no hay violaciones WCAG 2.1 AA
```

### ENB-004

**ID:** ENB-004 · **Título:** Reducción del impacto ambiental del software · **Épica Relacionada:** EP-04 ·
**Requisito:** RNF-012 · **Story Points:** 5 · **Sprint:** 4

**Redacción:** **Como** equipo de desarrollo, **necesitamos** aplicar las 8 optimizaciones Green IT y medirlas con
Lighthouse y el modelo SWDM v4, **para** reducir la huella de carbono del propio sistema.

```gherkin
Escenario: Umbrales de Lighthouse
  Dado el build de producción
  Cuando se audita con Lighthouse CI
  Entonces cumple score de 90 o más, FCP de 1 s o menos, LCP de 1,4 s o menos, TBT de 85 ms o menos, CLS de 0,02 o menos y peso de 1,1 MB o menos

Escenario: Huella por visita
  Dado los bytes transferidos antes y después
  Cuando se aplica SWDM v4
  Entonces los g CO2e por visita disminuyen
```

### ENB-005

**ID:** ENB-005 · **Título:** Pruebas E2E y monitoreo con Playwright · **Épica Relacionada:** EP-04 ·
**Requisito:** RNF-003, RNF-006 · **Story Points:** 5 · **Sprint:** 4

**Redacción:** **Como** equipo de desarrollo, **necesitamos** una suite Playwright en Chromium, Firefox y WebKit con
métricas de rendimiento y disponibilidad, **para** verificar el sistema desplegado.

```gherkin
Escenario: Flujos críticos en tres navegadores
  Dado la suite E2E
  Cuando se ejecuta en Chromium, Firefox y WebKit
  Entonces el 100 % de los casos críticos pasa y se guarda el reporte HTML

Escenario: Tiempos de API
  Dado el sistema desplegado
  Cuando la suite mide las APIs de listados
  Entonces cada una responde en menos de 500 ms
```

### ENB-006

**ID:** ENB-006 · **Título:** Despliegue continuo a producción · **Épica Relacionada:** EP-04 · **Requisito:** RNF-011 ·
**Story Points:** 3 · **Sprint:** 4

**Redacción:** **Como** equipo de desarrollo, **necesitamos** que un push a main o un tag v* despliegue automáticamente
usando GitHub Secrets, **para** tener siempre una URL operativa.

```gherkin
Escenario: Despliegue automático
  Dado un push a main con CI y pruebas en verde
  Cuando se ejecuta deploy-production.yml
  Entonces la nueva versión queda publicada sin pasos manuales

Escenario: Credenciales protegidas
  Dado el workflow de despliegue
  Cuando se revisa su código
  Entonces todas las credenciales provienen de GitHub Secrets
```

### ENB-007

**ID:** ENB-007 · **Título:** Evaluación de usabilidad SUS · **Épica Relacionada:** EP-04 · **Requisito:** RNF-008 ·
**Story Points:** 2 · **Sprint:** 4

**Redacción:** **Como** equipo de desarrollo, **necesitamos** aplicar el cuestionario SUS a 5 o más usuarios después de
tareas reales, **para** medir la usabilidad con un estándar.

```gherkin
Escenario: Puntaje calculado
  Dado 5 o más respuestas completas
  Cuando se calcula el SUS
  Entonces se obtiene el puntaje individual y el promedio con su grado A-F

Escenario: Respuesta incompleta
  Dado un cuestionario con una pregunta sin responder
  Cuando el participante intenta enviarlo
  Entonces el sistema no lo guarda y señala la pregunta faltante
```

## D. Resumen del Product Backlog

| Sprint | Ítems | Story Points |
|:-:|---|:-:|
| 1 | US-001, US-002, US-003, US-004, US-005, ENB-001 | 22 |
| 2 | US-006, US-007, ENB-002 | 21 |
| 3 | US-008, US-009, US-010, ENB-003 | 23 |
| 4 | US-011, US-012, US-013, US-014, US-015, ENB-004, ENB-005, ENB-006, ENB-007 | 36 |
| **Total** | 15 historias y 7 enablers | **102** |

El Sprint 4 dura tres semanas (30/10 al 19/11/2026) porque incluye las inspecciones 04 y 05 del curso.

## E. Definition of Done (DoD) Global del Proyecto

Una historia de usuario o enabler está **Done** solo si cumple todos los criterios:

| # | Criterio | Métrica objetiva | Cómo se verifica |
|:-:|---|---|---|
| 1 | Criterios de aceptación cumplidos | 100 % de los escenarios Gherkin de la historia pasan | Prueba automática (pytest, Vitest o Playwright) por escenario |
| 2 | Cobertura de pruebas unitarias | ≥ 80 % en backend y frontend | Reporte de cobertura en `tests.yml` y SonarQube Cloud |
| 3 | Análisis estático sin vulnerabilidades críticas | 0 bugs y 0 vulnerabilidades bloqueantes o críticas; Quality Gate PASSED | SonarQube Cloud |
| 4 | Revisión de código (Peer Review) | Pull Request aprobado antes del merge a `main` | PR en GitHub; al ser un equipo de una persona, la revisión par la cubre el análisis automático de SonarQube y una auto-revisión con lista de chequeo registrada en el PR |
| 5 | Despliegue automatizado | Versión publicada por `deploy-production.yml` y verificada con las pruebas `@public` | GitHub Actions |
| 6 | Documentación de API actualizada | Endpoints nuevos visibles en OpenAPI/Swagger (`/docs`) | Revisión de `/docs` |
| 7 | Estilo de código | 0 observaciones de Ruff y ESLint | `ci.yml` |
| 8 | Accesibilidad | 0 violaciones WCAG 2.1 AA en las pantallas afectadas | axe-core en Playwright |
| 9 | Seguimiento | Ítem en estado Done en Jira con enlace al PR o commit | Tablero Scrum de Jira |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 15/09/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial: 4 épicas, 15 historias, 7 enablers con Gherkin y DoD |
| 1.1.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Cambio de alcance del Sprint 4 (enunciado oficial del caso): historias y enablers reescritos con los campos del caso; US-008 y US-010 pasan al Sprint 4 |

[← Volver al README Principal](../../README.md)
