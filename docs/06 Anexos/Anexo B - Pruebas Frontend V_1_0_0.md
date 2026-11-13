# Anexo B: Pruebas del frontend (Vitest)

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

```bash
cd frontend
npm test -- --coverage
```

| Prueba | Qué verifica |
|---|---|
| mensajeError (3 casos) | Traducción de errores de la API (texto, 422, sin detalle) |
| formatear | Presentación de booleanos y vacíos |
| Login | El formulario es accesible y tiene campos requeridos |

Pegar aquí la salida real de Vitest.
