# Lecciones aprendidas

| Campo | Valor |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla |
| Organización | DistriRápido S.A.C., Huancayo, Junín |
| Curso | Taller de Proyectos 2, Universidad Continental |
| Versión | 1.0.0 |
| Fecha | 13/11/2026 |
| Elaborado por | Fernando Rodrigo Chaupis Espinoza |
| Revisado por | Docente: Daniel Gamarra Moreno |

---

| ID | Categoría | Situación | Lección | Recomendación |
|---|---|---|---|---|
| LA-01 | Técnica | Las versiones fijadas de PyJWT, Starlette y react-router tenían vulnerabilidades publicadas | Fijar versiones no basta: hay que revisarlas | Ejecutar `pip-audit` y `npm audit` en cada sprint o en el CI |
| LA-04 | Técnica | La prueba E2E mostró que el mensaje de pedidos sin asignar se leía como una cantidad | Las pruebas con capturas detectan problemas de lectura que las pruebas unitarias no ven | Revisar las capturas E2E en cada sprint |
| LA-02 | Gestión | La consigna exigía una metaheurística específica y se detectó tarde, revisando los repositorios de otros equipos | Los requisitos técnicos de la consigna son tan importantes como los RF | Hacer una lista de verificación de la consigna completa en el Sprint 0 |
| LA-03 | Equipo | En un proyecto individual no hay revisión entre pares del código | Las pruebas automáticas, el CI y SonarQube cumplen el papel de un revisor | Exigir Quality Gate aprobado antes de dar una historia por terminada |
