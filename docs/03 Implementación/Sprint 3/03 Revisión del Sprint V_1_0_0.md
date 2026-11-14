# Revisión del Sprint 3

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

**Sprint Goal:** Rutas realistas: jornada del conductor, preferencias del cliente y re-optimización ante incidentes.

## 1. Asistentes
| Nombre | Rol |
|---|---|
| Daniel Gamarra Moreno | Docente / evaluador |
| Fernando Rodrigo Chaupis Espinoza | Product Owner, Scrum Master y Developer |

## 2. Incremento demostrado
| ID | Historia / Enabler | Requisito | SP | Sprint |
|---|---|---|:-:|:-:|
| US-007 | Control de jornada máxima del conductor | RF-008 | 5 | 3 |
| US-008 | Preferencias de recepción de clientes | RF-009 | 5 | 3 |
| US-009 | Re-optimización dinámica ante incidentes | RF-007 | 8 | 3 |

## 3. Validación de criterios de aceptación
| Historia | Escenario probado | Resultado | Evidencia |
|---|---|---|---|
| US-007 | Pedidos que exceden la jornada quedan sin asignar | Cumple | [resultado-pytest.txt](../../06 Anexos/evidencias/resultado-pytest.txt) |
| US-008 | Llegada dentro del horario preferido del cliente | Cumple | [e2e-06-preferencias.png](../../06 Anexos/evidencias/e2e-06-preferencias.png) |
| US-009 | Incidente de tráfico: nueva ruta desde la última entrega; la original queda REOPTIMIZADA | Cumple | [e2e-08-ruta-reoptimizada.png](../../06 Anexos/evidencias/e2e-08-ruta-reoptimizada.png) |

## 4. Elementos no completados
Ninguno.

## 5. Retroalimentación de los interesados

