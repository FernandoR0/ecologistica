# Registro de Riesgos

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## Fórmula de Cálculo

**Exposición = Probabilidad (1-5) × Impacto (1-5).** Bajo: 1 a 5 · Medio: 6 a 11 · Alto: 12 a 25.

## Matriz de Evaluación de Riesgos

| ID | Riesgo | Categoría | Probabilidad | Impacto | Exposición | Nivel | Respuesta | Estado |
|---|---|---|:-:|:-:|:-:|:-:|---|---|
| R-01 | El motor no encuentra solución en el tiempo exigido para instancias grandes | Técnico | 3 | 5 | 15 | Alto | Mitigar: límite de tiempo, descarte con penalización y prueba de carga | Mitigado |
| R-02 | La distancia en línea recta no representa las calles reales | Técnico | 4 | 3 | 12 | Alto | Aceptar: factor vial 1.3 configurable; OSRM como mejora futura | Aceptado |
| R-03 | Poca disponibilidad de tiempo por ser un proyecto de una sola persona | Recursos | 4 | 3 | 12 | Alto | Mitigar: backlog priorizado y automatización (CI, pruebas) | Abierto |
| R-04 | Cambios de alcance pedidos en las revisiones | Alcance | 3 | 3 | 9 | Medio | Mitigar: control de cambios y backlog priorizado | Abierto |
| R-05 | Vulnerabilidades en el código o en las dependencias | Seguridad | 2 | 4 | 8 | Medio | Mitigar: OWASP, pip-audit, npm audit y SonarQube | Mitigado |
| R-06 | Pérdida del código fuente | Operativo | 1 | 5 | 5 | Bajo | Evitar: repositorio en GitHub | Mitigado |
| R-07 | Datos de clientes incompletos o con coordenadas erróneas | Datos | 3 | 3 | 9 | Medio | Mitigar: validación de rangos de coordenadas (422) | Mitigado |

## Resumen por Nivel de Severidad

| Nivel | Cantidad | Riesgos |
|---|:-:|---|
| Alto | 3 | R-01, R-02, R-03 |
| Medio | 3 | R-04, R-05, R-07 |
| Bajo | 1 | R-06 |

El seguimiento de cada riesgo está en `04 Seguimiento y Control/03 Seguimiento de riesgos`.

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
