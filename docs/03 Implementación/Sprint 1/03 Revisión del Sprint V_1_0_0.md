# Revisión del Sprint 1

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

**Sprint Goal:** Base del sistema: autenticación con roles y CRUD de flota, conductores y pedidos.

## 1. Asistentes
| Nombre | Rol |
|---|---|
| Daniel Gamarra Moreno | Docente / evaluador |
| Fernando Rodrigo Chaupis Espinoza | Product Owner, Scrum Master y Developer |

## 2. Incremento demostrado
| ID | Historia / Enabler | Requisito | SP | Sprint |
|---|---|---|:-:|:-:|
| US-001 | Inicio de sesión y control de acceso por roles | RNF-SEG | 5 | 1 |
| US-002 | Gestión de flota vehicular | RF-001 | 3 | 1 |
| US-003 | Gestión de conductores y asignación de vehículo | RF-008 | 3 | 1 |
| US-004 | Registro y gestión de pedidos con ventana horaria | RF-002 | 5 | 1 |

## 3. Validación de criterios de aceptación
| Historia | Escenario probado | Resultado | Evidencia |
|---|---|---|---|
| US-001 | Login correcto, incorrecto, bloqueo tras 5 intentos y 403 para CONDUCTOR | Cumple | [e2e-01-login.png](../../06 Anexos/evidencias/e2e-01-login.png) |
| US-002 | Alta, edición, placa duplicada (409) y baja lógica de vehículo | Cumple | [e2e-04-flota.png](../../06 Anexos/evidencias/e2e-04-flota.png) |
| US-003 | Registro de conductor con vehículo asignado | Cumple | [e2e-05-conductores.png](../../06 Anexos/evidencias/e2e-05-conductores.png) |
| US-004 | Pedido con coordenadas inválidas rechazado (422); listado paginado | Cumple | [e2e-03-pedidos.png](../../06 Anexos/evidencias/e2e-03-pedidos.png) |

## 4. Elementos no completados
Ninguno.

## 5. Retroalimentación de los interesados

