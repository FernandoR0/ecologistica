[← Volver al README Principal](../../../README.md)

# Evaluación cuantitativa de usabilidad (SUS)

| Campo | Detalle |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. |
| Líder del proyecto | Fernando Rodrigo Chaupis Espinoza |
| Historia técnica | ENB-007 - Evaluación de usabilidad SUS |
| Instrumento | System Usability Scale (Brooke, 1996), versión en español de 10 ítems |
| Fecha de aplicación | 20/11/2026 |
| Versión del documento | V_1_0_0 · 20/11/2026 |

## 1. Ficha técnica de la evaluación

| Elemento | Definición |
|---|---|
| Instrumento | SUS de 10 afirmaciones que alternan tono positivo (ítems impares) y negativo (ítems pares). Se eligió porque es el estándar de la industria, funciona con muestras pequeñas y permite comparar con el umbral de 68 puntos. |
| Escala de valoración | Likert de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo); las 10 afirmaciones son obligatorias. |
| Población objetivo | Usuarios finales del sistema según `08. Usuarios`: planificadores (perfil operador / técnico) y conductores de reparto. |
| Muestra | **n = 5** participantes voluntarios (mínimo de la rúbrica): 3 con el perfil Planificador y 2 con el perfil Conductor. Se registra su perfil real (ocupación y experiencia); no se registran nombres (Ley N.º 29733). Ninguno es empleado de DistriRápido S.A.C., que es la empresa del caso: los repartidores representan al conductor y los demás al planificador. |
| Entorno | Aplicación desplegada en producción (https://ecologistica.vercel.app), en el navegador del propio participante (PC o celular). Perfil Planificador con la cuenta `evaluador@ecologistica.pe`; perfil Conductor con la cuenta `conductor@ecologistica.pe`. |
| Modalidad | Moderada: el líder del proyecto observa, no ayuda salvo que el participante lo pida y anota dónde se detiene y qué comenta. |
| Recolección | Pantalla "Encuesta SUS" de la propia aplicación (`frontend/src/pages/Encuesta.tsx`). Cada participante responde una sola vez con un código (P1 a P5); la API rechaza códigos repetidos y respuestas incompletas. La encuesta muestra las tareas del perfil con el que se ingresó y guarda el perfil como "Planificador: …" o "Conductor: …". |
| Cálculo | Servicio `backend/app/services/sus.py`, cubierto por pruebas unitarias (`test_calculo_sus_ejemplo_del_estandar`, `test_encuesta_sus_en_la_aplicacion`). Resultados en Administración → "Resultados de la encuesta SUS" o en `GET /api/sus/resultados`. |
| Ciclo de mejora | Evaluación iterativa: cada cuello de botella observado se corrigió el mismo día, con pruebas automáticas y despliegue continuo, antes de que entrara el siguiente participante (sección 4.3). |

### 1.1 Participantes

| Código | Perfil de la app | Perfil real | Dispositivo | Versión probada |
|---|---|---|---|---|
| P1 | Planificador | Estudiante de Derecho; trabajó en centros de atención al cliente de operadoras de telefonía y usó sus paneles | PC | Mapa con pin y código automático ([1c9d421](https://github.com/FernandoR0/ecologistica/commit/1c9d421), [3a13a0e](https://github.com/FernandoR0/ecologistica/commit/3a13a0e)) |
| P2 | Conductor | Repartidor de productos para bodegas; trabajó como repartidor de una aplicación de delivery | Celular | Modo conductor con "Cómo llegar", sin conexión y menú para celular ([092890f](https://github.com/FernandoR0/ecologistica/commit/092890f)) |
| P3 | Conductor | Repartidor de carga | Celular | Confirmación de entrega, avance y foto ([8c5561d](https://github.com/FernandoR0/ecologistica/commit/8c5561d)) |
| P4 | Planificador | Diseñador gráfico | PC | Buscador de direcciones y nuevo diseño ([53131f2](https://github.com/FernandoR0/ecologistica/commit/53131f2)) |
| P5 | Planificador | Estudiante de Psicología | Celular | Buscador de direcciones y nuevo diseño ([53131f2](https://github.com/FernandoR0/ecologistica/commit/53131f2)) |

### 1.2 Tareas ejecutadas antes de responder

**Perfil Planificador**

| Tarea | Descripción | Historias relacionadas |
|---|---|---|
| T1 | Iniciar sesión con la cuenta de evaluador | US-001 |
| T2 | Registrar un cliente con su horario preferido, punto de referencia y ubicación | US-004 |
| T3 | Registrar un pedido para ese cliente | US-005 |
| T4 | Generar las rutas optimizadas y revisar el mapa | US-006, US-007 |
| T5 | Descargar el reporte PDF de sostenibilidad | US-012 |

**Perfil Conductor** (mide RNF-008, facilidad de aprendizaje del modo conductor)

| Tarea | Descripción | Historias relacionadas |
|---|---|---|
| T1 | Iniciar sesión con la cuenta de conductor | US-001 |
| T2 | Encontrar la siguiente entrega: cliente, dirección, referencia y hora | US-014 |
| T3 | Marcar esa entrega como "Entregado" | US-014 |
| T4 | Revisar cuántas entregas quedan pendientes en la ruta | US-014 |

Son los mismos recorridos que automatiza la suite Playwright, de modo que la medición subjetiva (SUS) y la técnica
(E2E) evalúan los mismos flujos.

### 1.3 Cuestionario aplicado

| # | Afirmación | Tono |
|:-:|---|:-:|
| 1 | Creo que me gustaría usar este sistema con frecuencia. | Positivo |
| 2 | Encontré el sistema innecesariamente complejo. | Negativo |
| 3 | Pensé que el sistema era fácil de usar. | Positivo |
| 4 | Creo que necesitaría el apoyo de un técnico para poder usar este sistema. | Negativo |
| 5 | Encontré que las distintas funciones del sistema estaban bien integradas. | Positivo |
| 6 | Pensé que había demasiada inconsistencia en el sistema. | Negativo |
| 7 | Imagino que la mayoría de las personas aprendería a usar este sistema muy rápido. | Positivo |
| 8 | Encontré el sistema muy engorroso de usar. | Negativo |
| 9 | Me sentí muy seguro usando el sistema. | Positivo |
| 10 | Necesité aprender muchas cosas antes de poder usar el sistema. | Negativo |

## 2. Método de cálculo

1. Ítems impares (positivos): aporte = respuesta − 1.
2. Ítems pares (negativos): aporte = 5 − respuesta.
3. Puntaje SUS individual = (suma de los 10 aportes) × 2,5, en escala de 0 a 100.
4. Puntaje global = promedio de los puntajes individuales.

**Clasificación:**

| Escala | Rangos |
|---|---|
| Grado (Sauro y Lewis, 2016) | A+ ≥ 84,1 · A ≥ 80,8 · A− ≥ 78,9 · B+ ≥ 77,2 · B ≥ 74,1 · B− ≥ 72,6 · C+ ≥ 71,1 · C ≥ 65,0 · C− ≥ 62,7 · D ≥ 51,7 · F < 51,7 |
| Adjetivo (Bangor, Kortum y Miller, 2009) | Excelente ≥ 85,5 · Bueno ≥ 72,6 · Aceptable ≥ 52,1 · Pobre ≥ 38,0 · Muy pobre < 38,0 |
| Umbral de aceptación | ≥ 68 (promedio de la industria) |

## 3. Resultados cuantitativos

### 3.1 Matriz de respuestas brutas

Respuestas registradas en la aplicación (Administración → "Resultados de la encuesta SUS"), sin modificar.

| Participante | Perfil | Ítem 1 | Ítem 2 | Ítem 3 | Ítem 4 | Ítem 5 | Ítem 6 | Ítem 7 | Ítem 8 | Ítem 9 | Ítem 10 |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| P1 | Planificador | 4 | 1 | 5 | 1 | 4 | 1 | 5 | 1 | 5 | 1 |
| P2 | Conductor | 5 | 1 | 4 | 1 | 4 | 1 | 5 | 1 | 5 | 2 |
| P3 | Conductor | 5 | 1 | 5 | 1 | 5 | 2 | 5 | 1 | 4 | 1 |
| P4 | Planificador | 5 | 2 | 3 | 2 | 4 | 3 | 2 | 2 | 3 | 3 |
| P5 | Planificador | 5 | 2 | 4 | 3 | 4 | 2 | 5 | 1 | 4 | 3 |

### 3.2 Cálculo paso a paso por participante

| Participante | Aportes de ítems impares (respuesta − 1) | Aportes de ítems pares (5 − respuesta) | Puntaje SUS | Grado |
|---|---|---|---|:-:|
| P1 | (4−1) + (5−1) + (4−1) + (5−1) + (5−1) = 3 + 4 + 3 + 4 + 4 = 18 | (5−1) + (5−1) + (5−1) + (5−1) + (5−1) = 4 + 4 + 4 + 4 + 4 = 20 | (18 + 20) × 2,5 = **95,0** | A+ |
| P2 | (5−1) + (4−1) + (4−1) + (5−1) + (5−1) = 4 + 3 + 3 + 4 + 4 = 18 | (5−1) + (5−1) + (5−1) + (5−1) + (5−2) = 4 + 4 + 4 + 4 + 3 = 19 | (18 + 19) × 2,5 = **92,5** | A+ |
| P3 | (5−1) + (5−1) + (5−1) + (5−1) + (4−1) = 4 + 4 + 4 + 4 + 3 = 19 | (5−1) + (5−1) + (5−2) + (5−1) + (5−1) = 4 + 4 + 3 + 4 + 4 = 19 | (19 + 19) × 2,5 = **95,0** | A+ |
| P4 | (5−1) + (3−1) + (4−1) + (2−1) + (3−1) = 4 + 2 + 3 + 1 + 2 = 12 | (5−2) + (5−2) + (5−3) + (5−2) + (5−3) = 3 + 3 + 2 + 3 + 2 = 13 | (12 + 13) × 2,5 = **62,5** | D |
| P5 | (5−1) + (4−1) + (4−1) + (5−1) + (4−1) = 4 + 3 + 3 + 4 + 3 = 17 | (5−2) + (5−3) + (5−2) + (5−1) + (5−3) = 3 + 2 + 3 + 4 + 2 = 14 | (17 + 14) × 2,5 = **77,5** | B+ |

Los cinco puntajes coinciden con los que calcula la aplicación (`backend/app/services/sus.py`).

### 3.3 Puntaje SUS promedio global

**SUS global = (95,0 + 92,5 + 95,0 + 62,5 + 77,5) / 5 = 422,5 / 5 = 84,5**

| Estadístico | Valor |
|---|---|
| n | 5 |
| Promedio | **84,5** |
| Desviación estándar (muestral) | 14,3 |
| Mínimo / máximo | 62,5 / 95,0 |
| Promedio perfil Planificador (P1, P4, P5) | (95,0 + 62,5 + 77,5) / 3 = **78,3** |
| Promedio perfil Conductor (P2, P3) | (92,5 + 95,0) / 2 = **93,8** |

### 3.4 Aporte promedio por ítem

Aporte promedio de cada ítem en la escala de 0 a 4 (4 = mejor percepción). Sirve para ubicar qué aspecto bajó el puntaje.

| Ítem | Aporte promedio | Lectura |
|:-:|:-:|---|
| 1 Uso frecuente | 3,8 | Muy alto |
| 2 Complejidad | 3,6 | Alto |
| 3 Facilidad de uso | 3,2 | Medio-alto (P4 respondió 3) |
| 4 Apoyo técnico | 3,4 | Alto (P5 respondió 3) |
| 5 Integración | 3,2 | Medio-alto |
| 6 Consistencia | 3,2 | Medio-alto (P4 respondió 3) |
| 7 Aprendizaje rápido | 3,4 | Alto, salvo P4, que respondió 2 |
| 8 Engorroso | 3,8 | Muy alto |
| 9 Seguridad al usarlo | 3,2 | Medio-alto (P4 respondió 3) |
| 10 Aprendizaje previo | **3,0** | El más bajo: P4 y P5 respondieron 3 |

Suma de los aportes promedio = 33,8; 33,8 × 2,5 = 84,5 (verificación del promedio global).

## 4. Análisis e interpretación

### 4.1 Ubicación frente al estándar

- El puntaje global de **84,5 supera en 16,5 puntos el umbral de aceptación de 68**: la usabilidad del sistema es
  aceptable. Le corresponde el **grado A+** (Sauro y Lewis) y el adjetivo **"Bueno"** (Bangor y otros), muy cerca del
  límite de "Excelente" (85,5). Por participante: tres A+ (P1, P2, P3), un B+ (P5) y un D (P4).
- El objetivo de RNF-008 (SUS promedio ≥ 68) se cumple con holgura, en especial en el **modo conductor (93,8)**, que es
  el perfil para el que el caso exige una interfaz simple (RNF-05 del caso: "modo conductor" para personas con
  educación formal básica).
- Con n = 5 el resultado debe leerse con cautela: la desviación de 14,3 puntos muestra que la experiencia no fue pareja.
  Los dos puntajes más bajos (P4 con 62,5 y P5 con 77,5) corresponden a los participantes que encontraron problemas en
  los formularios de planificación; los tres que no tuvieron trabas puntuaron entre 92,5 y 95.

### 4.2 Cuellos de botella identificados

| # | Participante | Tarea | Observación | Ítems que lo reflejan |
|:-:|---|---|---|---|
| 1 | P1 (prueba piloto) | T2 Registrar cliente | Se detuvo porque el formulario pedía escribir latitud y longitud, que no sabía qué eran. | 4 y 10 (necesidad de apoyo y de aprender antes) |
| 2 | Líder del proyecto, al revisar la tarea T3 antes de que P1 continuara | T3 Registrar pedido | El código del pedido era obligatorio y debía ser único en todo el sistema, sin indicar cuáles existían. | No aplica (hallazgo del observador) |
| 3 | P1 | T2 | Sugirió buscar por dirección o punto de referencia y que el pin se ubique solo en el mapa. | 3 (facilidad) |
| 4 | P2 | T3 Marcar entregado | Al principio pensó que había un error porque el mapa marcaba una sola ubicación; entendió por su experiencia previa en reparto que al marcar "Entregado" pasaba a la siguiente. Sugirió hacer más evidente el paso de una entrega a otra, que se note mejor la entrega realizada y poder confirmar con una foto. | 7 (aprendizaje) |
| 5 | P4 | T3 Registrar pedido | Ingresó 230 m³: no se guardó, pero no vio ninguna advertencia. Con 23 m³ sí se guardó, aunque ningún vehículo tiene esa capacidad; recién al generar rutas apareció como "sin asignar". | 3, 6, 7 y 9 (sus valores más bajos) |
| 6 | P5 | T2 Registrar cliente | No pudo guardar el cliente: escribió el horario "de 12 a 6" pensando en el formato de 12 horas, y el aviso de error aparecía en la parte superior de la página, fuera de su vista en el celular. No completó T2 ni las tareas siguientes que dependían de ese cliente. | 4 y 10 (apoyo técnico, aprendizaje previo) |

Patrón común: los puntajes bajos no se deben al motor de rutas ni al modo conductor, sino a **formularios que piden datos
técnicos (coordenadas, códigos, formato de hora) o que avisan los errores lejos de donde mira el usuario**.

### 4.3 Mejoras aplicadas (verificables)

Cada mejora se publicó en producción el mismo día, con pruebas automáticas (backend, unitarias y E2E en Chromium,
Firefox y WebKit), antes de que entrara el siguiente participante.

| Cuello de botella | Mejora aplicada | Commit | Verificación |
|:-:|---|---|---|
| 1 | El formulario de clientes muestra un mapa: se toca el lugar o se arrastra el pin y las coordenadas se llenan solas; escribirlas queda como opción. | [1c9d421](https://github.com/FernandoR0/ecologistica/commit/1c9d421) | Pruebas de `gestion.test.tsx` y E2E de registro de cliente |
| 2 | El código del pedido lo genera el sistema (PED-0001…). | [3a13a0e](https://github.com/FernandoR0/ecologistica/commit/3a13a0e) | `test_codigo_de_pedido_automatico` y E2E de pedido |
| 3 | Buscador de dirección o lugar de referencia (OpenStreetMap, limitado a Huancayo) en clientes, pedidos y punto de partida; el pin se ubica solo y se propone la dirección y el distrito. | [53131f2](https://github.com/FernandoR0/ecologistica/commit/53131f2) | `geocodificar.test.ts`, pruebas del buscador y E2E con la búsqueda |
| 4 | Confirmación visible "Entregado a X a las HH:MM", avance de la ruta ("Ahora vas a · 2 de 4") y foto opcional de la entrega. | [8c5561d](https://github.com/FernandoR0/ecologistica/commit/8c5561d) | Pruebas de `rutas.test.tsx` y E2E con una foto real |
| 5 | El formulario muestra el límite de la flota en peso y volumen y avisa junto al botón Guardar si ningún vehículo puede llevar el pedido; la API también lo rechaza. | [b6dd9fc](https://github.com/FernandoR0/ecologistica/commit/b6dd9fc) | `test_pedido_que_no_cabe_en_la_flota_se_rechaza_al_registrarlo` y E2E de avisos |
| 6 | Ayuda visible "Formato de 24 horas… 18:00 = 6 de la tarde" en los horarios, validación con un mensaje que explica el error, y todos los avisos de los formularios junto al botón Guardar. | [b6dd9fc](https://github.com/FernandoR0/ecologistica/commit/b6dd9fc) | Pruebas de `gestion.test.tsx` y E2E de avisos |

Además, durante la preparación de la prueba del perfil Conductor se corrigió el menú para celular
([092890f](https://github.com/FernandoR0/ecologistica/commit/092890f)) y la encuesta pasó a mostrar las tareas de cada
perfil ([7d9e7a0](https://github.com/FernandoR0/ecologistica/commit/7d9e7a0)).

**Efecto observado:** después de las mejoras 1 a 4, los participantes P2 y P3 completaron sus tareas sin ayuda y
puntuaron 92,5 y 95. P4 y P5 encontraron los cuellos de botella 5 y 6, que se corrigieron después de su sesión; su efecto
se medirá en la siguiente aplicación de la encuesta.

### 4.4 Mejoras propuestas

| Mejora | Motivo | Prioridad |
|---|---|---|
| Volver a aplicar la encuesta a nuevos participantes del perfil Planificador con la versión que incluye las mejoras 5 y 6 | Verificar el efecto en los ítems 3, 4, 7 y 10 | Alta |
| Selector de hora con "a. m./p. m." visible en celular o lista de horas | El campo de hora nativo depende del idioma del celular | Media |
| Reemplazar los emojis de los botones por íconos SVG con texto | Consistencia visual y lectura en lectores de pantalla | Baja |
| Avisar si el celular no tiene espacio para guardar fotos sin conexión | Evitar pérdidas en jornadas largas sin señal | Media |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 20/11/2026 | Fernando Rodrigo Chaupis Espinoza | Evaluación SUS con n = 5 (3 planificadores y 2 conductores): matriz de respuestas, cálculo por participante, promedio global de 84,5 (A+), cuellos de botella y 6 mejoras aplicadas |

[← Volver al README Principal](../../../README.md)
