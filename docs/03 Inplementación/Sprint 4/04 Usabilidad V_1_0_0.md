[← Volver al README Principal](../../../README.md)

# Evaluación cuantitativa de usabilidad (SUS)

| Campo | Detalle |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. |
| Líder del proyecto | Fernando Rodrigo Chaupis Espinoza |
| Historia técnica | ENB-007 - Evaluación de usabilidad SUS |
| Instrumento | System Usability Scale (Brooke, 1996), versión en español de 10 ítems |
| Versión del documento | V_1_0_0 · 19/11/2026 |

## 1. Ficha técnica de la evaluación

| Elemento | Definición |
|---|---|
| Instrumento | SUS de 10 afirmaciones que alternan tono positivo (ítems impares) y negativo (ítems pares). Se eligió porque es el estándar de la industria, funciona con muestras pequeñas y permite comparar con el umbral de 68 puntos. |
| Escala de valoración | Likert de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo); las 10 afirmaciones son obligatorias. |
| Población objetivo | Usuarios finales del sistema según `08. Usuarios`: planificadores, conductores y personal administrativo de DistriRápido. |
| Muestra | n ≥ 5 participantes (mínimo de la rúbrica). Se registra el perfil de cada uno (ocupación y experiencia con aplicaciones similares); no se registran nombres (Ley N.º 29733). |
| Entorno | Aplicación desplegada en producción, navegador del propio participante, cuenta de evaluador (`evaluador@ecologistica.pe`, rol PLANIFICADOR). |
| Modalidad | Moderada: el líder del proyecto observa, no ayuda salvo que el participante lo pida, y anota si cada tarea se completó sin ayuda. |
| Recolección | Pantalla "Encuesta SUS" de la propia aplicación (`frontend/src/pages/Encuesta.tsx`): cada participante responde una sola vez con un código (P1, P2…); la API rechaza códigos repetidos y respuestas incompletas. |
| Cálculo | Servicio `backend/app/services/sus.py`, cubierto por pruebas unitarias (`test_calculo_sus_ejemplo_del_estandar`, `test_encuesta_sus_en_la_aplicacion`). Los resultados se consultan en Administración → "Resultados de la encuesta SUS" o en `GET /api/sus/resultados`. |

### 1.1 Tareas ejecutadas antes de responder

| Tarea | Descripción | Historias relacionadas |
|---|---|---|
| T1 | Iniciar sesión con la cuenta de evaluador | US-001 |
| T2 | Registrar un cliente con su horario preferido y punto de referencia | US-004 |
| T3 | Registrar un pedido para ese cliente | US-005 |
| T4 | Generar las rutas optimizadas y revisar el mapa | US-006, US-007 |
| T5 | Descargar el reporte PDF de sostenibilidad | US-012 |

Son los mismos recorridos que automatiza la suite Playwright, de modo que la medición subjetiva (SUS) y la técnica
(E2E) evalúan los mismos flujos.

### 1.2 Cuestionario aplicado

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

Ejemplo verificado por la prueba automática: respuestas (4, 2, 4, 1, 4, 2, 5, 2, 4, 2) → impares 3 + 3 + 3 + 4 + 3 = 16;
pares 3 + 4 + 3 + 3 + 3 = 16; SUS = (16 + 16) × 2,5 = **80,0**.

**Clasificación:**

| Escala | Rangos |
|---|---|
| Grado (Sauro y Lewis, 2016) | A+ ≥ 84,1 · A ≥ 80,8 · A− ≥ 78,9 · B+ ≥ 77,2 · B ≥ 74,1 · B− ≥ 72,6 · C+ ≥ 71,1 · C ≥ 65,0 · C− ≥ 62,7 · D ≥ 51,7 · F < 51,7 |
| Adjetivo (Bangor, Kortum y Miller, 2009) | Excelente ≥ 85,5 · Bueno ≥ 72,6 · Aceptable ≥ 52,1 · Pobre ≥ 38,0 · Muy pobre < 38,0 |
| Umbral de aceptación | ≥ 68 (promedio de la industria) |

## 3. Resultados cuantitativos

**Estado de la recolección al 19/11/2026:** la encuesta está publicada dentro de la aplicación y la convocatoria a los
participantes está en curso; aún no hay respuestas registradas (n = 0). Esta sección se completa con la matriz de
respuestas brutas, el cálculo individual y el promedio global en cuanto la muestra llegue a 5 participantes.

## 4. Análisis e interpretación

Se completa con los resultados de la sección 3: ubicación frente al umbral de 68, grado A–F, cuellos de botella por
ítem y mejoras aplicadas o propuestas.

### 4.1 Mejoras de usabilidad ya aplicadas en este sprint

| Mejora | Motivo | Verificación |
|---|---|---|
| Modo conductor con texto e íconos grandes y la siguiente entrega resaltada | RNF-05 del caso: conductores con poca experiencia en aplicaciones | Prueba E2E "Modo conductor" y pruebas de `MiRuta` |
| Mensajes de error comprensibles ante caídas de red o del servidor | Evitar textos técnicos como "Failed to fetch" | Casos 21-23 del análisis Playwright |
| Pedido que hereda dirección, referencia y horario del cliente | Menos campos que llenar por cada pedido | Caso 8 del análisis Playwright |
| Frase de ahorro en lenguaje simple en el Dashboard | RF-005 del caso | Prueba de `Paneles` |

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 19/11/2026 | Fernando Rodrigo Chaupis Espinoza | Ficha técnica, tareas, cuestionario y método; recolección en curso |

[← Volver al README Principal](../../../README.md)
