# Registro de impedimentos

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

**Sprint 5:** 13/11/2026 - 26/11/2026

| Impedimento # | Fecha de Registro | Descripción del Impedimento así como el Impacto en el Proyecto | Prioridad | Reportado por | Fecha tope de Resolución | Estado | Fecha de Resolución | Resolución/Comentarios |
|---|---|---|---|---|---|---|---|---|
| IMP-01 | 13/11/2026 | El repositorio se creó en una cuenta de GitHub que no era la institucional. Impacto: el docente no reconocería la autoría. | Alta | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | Repositorio creado en la cuenta FernandoR0 (correo institucional) |
| IMP-02 | 13/11/2026 | Rutas de más de 260 caracteres en Windows impedían clonar repositorios y escribir documentos. Impacto: no se podían generar los documentos. | Media | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | `git -c core.longpaths=true` y prefijo `\\?\` en los scripts |
| IMP-03 | 13/11/2026 | PyJWT, Starlette y react-router con vulnerabilidades publicadas (pip-audit / npm audit). Impacto: riesgo OWASP A03. | Alta | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | Actualización de dependencias; 0 vulnerabilidades en producción |
| IMP-04 | 13/11/2026 | Docker Desktop no levantó su motor en la máquina local. Impacto: no se pudo ejecutar SonarQube local. | Media | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | Análisis en SonarQube Cloud con GitHub Actions |
| IMP-05 | 13/11/2026 | El motor usaba Guided Local Search y la consigna exige Algoritmo Genético, Búsqueda Tabú u Optimización por Colonia de Hormigas. Impacto: incumplimiento de la consigna. | Alta | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | Cambio a Búsqueda Tabú; pruebas y prueba de carga repetidas con el mismo resultado |
| IMP-06 | 13/11/2026 | Cobertura del frontend en 10.7 %. Impacto: el Quality Gate de SonarQube no se cumpliría. | Alta | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | 38 pruebas nuevas; cobertura 99.7 % |
| IMP-07 | 13/11/2026 | SonarQube analizó los reportes HTML de evidencia y luego marcó 10.5 % de cobertura en el código nuevo. Impacto: métricas falsas y Quality Gate en error. | Media | Fernando Rodrigo Chaupis Espinoza | 13/11/2026 | Resuelto | 13/11/2026 | `docs/**` excluido del análisis y scripts de medición excluidos de la cobertura |
| IMP-08 | 13/11/2026 | La encuesta SUS necesita 5 usuarios externos. Impacto: falta el puntaje SUS (RNF-04). | Media | Fernando Rodrigo Chaupis Espinoza | 26/11/2026 | En curso | - | Preguntas enviadas a 5 personas |

**Resumen Sprint 5:** 7 resueltos · 1 en curso (IMP-08).

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
