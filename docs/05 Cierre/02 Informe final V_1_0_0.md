# Informe final

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

## 1. Resumen ejecutivo
EcoLogística planifica las rutas de reparto de DistriRápido S.A.C. con un motor VRPTW + Green VRP (Google OR-Tools). Con los datos de demostración (20 pedidos, 3 vehículos) reduce la distancia de 55.8 km a 28.1 km (-49.7 %) y las emisiones de 12.6 kg a 5.4 kg de CO₂ (-57 %), respetando capacidad, ventanas horarias, preferencias de los clientes y la jornada de los conductores. Para 150 pedidos y 15 vehículos genera las rutas en 30 s, por debajo de la meta de 45 s.

## 2. Alcance logrado
Todos los requisitos RF-001 a RF-010 están implementados (ver `01 Inicio/06`). Desviaciones: la encuesta SUS se aplica al cierre y el sistema se despliega localmente con Docker Compose (sin servidor de staging en la nube).

## 3. Resultados técnicos
- Motor VRPTW + Green VRP con OR-Tools: capacidad, ventanas horarias, jornada del conductor, preferencias.
- Re-optimización ante tráfico, bloqueo de vía, clima y avería.
- 27 pruebas de backend (cobertura 90 %), 5 de frontend y 4 E2E con Playwright, todas aprobadas.
- Prueba de carga: 150 pedidos y 15 vehículos en 30 s, sin pedidos sin asignar.
- Lighthouse en el login: 100 en desempeño, accesibilidad, buenas prácticas y SEO. axe-core: 0 violaciones WCAG 2.1 AA en las 8 pantallas.
- Dependencias de producción sin vulnerabilidades conocidas (pip-audit, npm audit).
- _Completar_: puntaje SUS y resultado de SonarQube.

## 4. Costos y tiempo reales vs. planificados
_Completar_

## 5. Conclusiones y recomendaciones
- Integrar un servidor OSRM para distancias por calles reales.
- _Completar_
