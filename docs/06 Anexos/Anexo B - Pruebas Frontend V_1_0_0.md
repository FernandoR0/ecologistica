# Anexo B: Pruebas del frontend (Vitest)

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

```bash
cd frontend
npm test -- --coverage
```

| Prueba | Qué verifica |
|---|---|
| mensajeError (3 casos) | Traducción de errores de la API (texto, 422, sin detalle) |
| formatear | Presentación de booleanos y vacíos |
| Login | El formulario es accesible y tiene campos requeridos |

**5 pruebas aprobadas, 0 fallidas.** Salida completa en [evidencias/resultado-vitest.txt](evidencias/resultado-vitest.txt).

La cobertura de líneas de las pruebas unitarias del frontend es baja (10.7 %) porque las pantallas se validan con las pruebas E2E del Anexo C, que recorren todas las vistas en el navegador real.
