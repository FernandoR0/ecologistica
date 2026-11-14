# Registro de riesgos

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

| ID | Riesgo | Prob. (1–5) | Impacto (1–5) | Nivel | Respuesta | Responsable | Estado |
|---|---|:-:|:-:|:-:|---|---|---|
| R-01 | El motor no encuentra solución en tiempo para instancias grandes | 3 | 5 | 15 | Límite de tiempo + descarte de pedidos con penalización; prueba de carga | Dev | Mitigado |
| R-02 | Distancias en línea recta no representan las calles reales | 4 | 3 | 12 | Factor vial 1.3; evaluar OSRM en sprint futuro | Dev | Aceptado |
| R-03 | Baja disponibilidad del equipo en semanas de exámenes | 4 | 3 | 12 | Planificar menos SP en esas semanas | SM | Abierto |
| R-04 | Cambios de requisitos por parte del docente | 3 | 3 | 9 | Backlog priorizado y control de cambios | PO | Abierto |
| R-05 | Vulnerabilidades de seguridad | 2 | 4 | 8 | Revisión OWASP, SonarQube, dependencias fijadas | Dev | Mitigado |
| R-06 | Pérdida de código | 1 | 5 | 5 | GitHub + ramas protegidas | SM | Mitigado |

## Oportunidades

| ID | Oportunidad | Acción |
|---|---|---|
| O-01 | Vehículos eléctricos en la flota | El Green VRP los prioriza para reducir CO₂ |
| O-02 | Reutilizar el motor para otras empresas de Huancayo | Mantener el motor desacoplado de la BD |
