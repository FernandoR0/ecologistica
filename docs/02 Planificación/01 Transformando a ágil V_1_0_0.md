# Transformando a Ágil

**Nombre del Proyecto:** EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C.

**Líder del Proyecto:** Fernando Rodrigo Chaupis Espinoza (Product Owner, Scrum Master y Developer; proyecto individual)

**Docente:** Daniel Gamarra Moreno

**Fecha:** 13/11/2026

**Versión:** 1.0.0

---

## A. Metodología de Transformación

1. Cada requisito funcional se agrupa en una épica según el área del negocio.
2. Cada épica se divide en historias de usuario con el formato «Como… quiero… para…», criterios de aceptación en
   Gherkin y estimación en story points (Fibonacci).
3. Los requisitos no funcionales se convierten en historias técnicas (enablers) o en condiciones de la Definition of Done.
4. Cada historia es un issue de GitHub asignado a un hito (sprint).

### Mapa de Trazabilidad RF/RNF → Épicas → Historias

| Requisito | Épica | Historias |
|---|---|---|
| RF-001 | EP-01 | US-002 |
| RF-002 | EP-01 | US-004 |
| RF-003 | EP-02 | US-005 |
| RF-004 | EP-02 | US-006 |
| RF-005 | EP-03 | US-010 |
| RF-006 | EP-03 | US-011 |
| RF-007 | EP-02 | US-009 |
| RF-008 | EP-01 | US-003, US-007 |
| RF-009 | EP-02 | US-008 |
| RF-010 | EP-03 | US-012 |
| RNF-02 | EP-01 | US-001 |
| RNF-01, RNF-04, RNF-05, RNF-07, RNF-08 | EP-04 | ENB-001, ENB-002 |

## B. Épicas e Historias de Usuario

| Épica | Nombre | Historias |
|---|---|---|
| EP-01 | Gestión operativa e identidad | US-001, US-002, US-003, US-004 |
| EP-02 | Motor de rutas y operación en campo | US-005, US-006, US-007, US-008, US-009 |
| EP-03 | Sostenibilidad e indicadores | US-010, US-011, US-012 |
| EP-04 | Calidad y despliegue | ENB-001, ENB-002 |

#### US-001 - Iniciar sesión con mi correo y contraseña y ver solo lo que mi rol permite

**Como** usuario del sistema, **quiero** iniciar sesión con mi correo y contraseña y ver solo lo que mi rol permite, **para** proteger la información de la empresa.

**Requisito:** RNF-02 · **Story points:** 5 · **Sprint:** 1 · **Issue:** [#1](https://github.com/FernandoR0/ecologistica/issues/1)

#### US-002 - Registrar y actualizar los vehículos de la flota

**Como** planificador, **quiero** registrar y actualizar los vehículos de la flota, **para** planificar con datos reales de capacidad y consumo.

**Requisito:** RF-001 · **Story points:** 3 · **Sprint:** 1 · **Issue:** [#2](https://github.com/FernandoR0/ecologistica/issues/2)

#### US-003 - Registrar conductores y asignarles un vehículo

**Como** planificador, **quiero** registrar conductores y asignarles un vehículo, **para** saber quién conduce cada ruta.

**Requisito:** RF-008 · **Story points:** 3 · **Sprint:** 1 · **Issue:** [#3](https://github.com/FernandoR0/ecologistica/issues/3)

#### US-004 - Registrar pedidos con ubicación, peso y ventana horaria

**Como** planificador, **quiero** registrar pedidos con ubicación, peso y ventana horaria, **para** que el motor los pueda planificar.

**Requisito:** RF-002 · **Story points:** 5 · **Sprint:** 1 · **Issue:** [#4](https://github.com/FernandoR0/ecologistica/issues/4)

#### US-005 - Generar rutas optimizadas con un clic

**Como** planificador, **quiero** generar rutas optimizadas con un clic, **para** recorrer menos kilómetros y emitir menos CO₂.

**Requisito:** RF-003 · **Story points:** 13 · **Sprint:** 2 · **Issue:** [#5](https://github.com/FernandoR0/ecologistica/issues/5)

#### US-006 - Ver las rutas en un mapa con las paradas numeradas

**Como** planificador o conductor, **quiero** ver las rutas en un mapa con las paradas numeradas, **para** entender el recorrido de un vistazo.

**Requisito:** RF-004 · **Story points:** 5 · **Sprint:** 2 · **Issue:** [#6](https://github.com/FernandoR0/ecologistica/issues/6)

#### US-007 - Que mi ruta no supere mi jornada máxima

**Como** conductor, **quiero** que mi ruta no supere mi jornada máxima, **para** cumplir la normativa laboral.

**Requisito:** RF-008 · **Story points:** 5 · **Sprint:** 3 · **Issue:** [#7](https://github.com/FernandoR0/ecologistica/issues/7)

#### US-008 - Registrar el horario en que cada cliente prefiere recibir

**Como** planificador, **quiero** registrar el horario en que cada cliente prefiere recibir, **para** no llegar cuando el cliente no puede atender.

**Requisito:** RF-009 · **Story points:** 5 · **Sprint:** 3 · **Issue:** [#8](https://github.com/FernandoR0/ecologistica/issues/8)

#### US-009 - Re-optimizar una ruta cuando ocurre un incidente

**Como** planificador, **quiero** re-optimizar una ruta cuando ocurre un incidente, **para** cumplir las entregas pendientes.

**Requisito:** RF-007 · **Story points:** 8 · **Sprint:** 3 · **Issue:** [#9](https://github.com/FernandoR0/ecologistica/issues/9)

#### US-010 - Ver un dashboard con los indicadores de la operación

**Como** gerente, **quiero** ver un dashboard con los indicadores de la operación, **para** tomar decisiones con datos.

**Requisito:** RF-005 · **Story points:** 5 · **Sprint:** 4 · **Issue:** [#10](https://github.com/FernandoR0/ecologistica/issues/10)

#### US-011 - Ver el reporte de CO₂ emitido, evitado y compensado

**Como** gerente, **quiero** ver el reporte de CO₂ emitido, evitado y compensado, **para** medir la huella de carbono de la flota.

**Requisito:** RF-006 · **Story points:** 5 · **Sprint:** 4 · **Issue:** [#11](https://github.com/FernandoR0/ecologistica/issues/11)

#### US-012 - Ver un plan para compensar el CO₂ y registrar lo compensado

**Como** administrador, **quiero** ver un plan para compensar el CO₂ y registrar lo compensado, **para** avanzar hacia la neutralidad de carbono.

**Requisito:** RF-010 · **Story points:** 3 · **Sprint:** 4 · **Issue:** [#12](https://github.com/FernandoR0/ecologistica/issues/12)

## C. Historias Técnicas (Enablers)

| ID | Épica | Descripción | Requisito | SP | Sprint | Issue |
|---|---|---|---|:-:|:-:|:-:|
| ENB-001 | EP-04 | CI/CD, Docker y auditoría Green IT | RNF-08, RNF-10, RNF-11 | 5 | 5 | [#13](https://github.com/FernandoR0/ecologistica/issues/13) |
| ENB-002 | EP-04 | Pruebas E2E, prueba de carga y usabilidad SUS | RNF-01, RNF-06 | 5 | 5 | [#14](https://github.com/FernandoR0/ecologistica/issues/14) |

## D. Definition of Done (DoD) Global del Proyecto

- [x] El código está en la rama `main` del repositorio.
- [x] Las pruebas automáticas pasan en GitHub Actions (CI).
- [x] La cobertura de pruebas del backend y del frontend es ≥ 80 %.
- [x] Ruff y ESLint no reportan observaciones.
- [x] Los criterios de aceptación de la historia se verificaron (prueba automática o E2E).
- [x] La documentación del sprint está actualizada.
- [x] El issue de la historia está cerrado con el commit que la implementa.

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial |
