# Anexo C: Pruebas E2E

| Campo | Valor |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla |
| Organización | DistriRápido S.A.C., Huancayo, Junín |
| Curso | Taller de Proyectos 2, Universidad Continental |
| Versión | 1.0.0 |
| Fecha | _Completar_ |
| Elaborado por | _Completar_ |
| Revisado por | Docente: Daniel Gamarra Moreno |

---

Pruebas de extremo a extremo sobre el sistema desplegado con `docker compose up`.

```gherkin
Característica: Planificación de rutas

  Escenario: E2E-01 Generar rutas con datos demo
    Dado que inicio sesión como planificador@ecologistica.pe
    Y existen 20 pedidos pendientes
    Cuando abro "Rutas" y pulso "Generar rutas optimizadas"
    Entonces veo las rutas dibujadas en el mapa con paradas numeradas
    Y el resumen muestra ahorro de km mayor a 0

  Escenario: E2E-02 Re-optimizar por avería
    Dado una ruta planificada
    Cuando registro un incidente "Avería del vehículo" a las 10:00
    Entonces las paradas pendientes pasan a otro vehículo libre

  Escenario: E2E-03 Conductor sin permisos de gestión
    Dado que inicio sesión como conductor@ecologistica.pe
    Entonces no veo los menús Pedidos, Flota ni Conductores
```

| ID | Resultado | Evidencia |
|---|---|---|
| E2E-01 | _Completar_ | Captura |
| E2E-02 | _Completar_ | Captura |
| E2E-03 | _Completar_ | Captura |

Herramienta sugerida para automatizarlas: Playwright.
