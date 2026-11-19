[← Volver al README Principal](../../README.md)

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

| Archivo | Pruebas | Qué verifica |
|---|:-:|---|
| `src/app.test.tsx` | 5 | Traducción de errores de la API, formato de valores y formulario de login accesible |
| `src/test/api.test.ts` | 7 | Token en la cabecera, métodos POST/PUT/DELETE, errores como `ApiError`, 401 redirige al login, paginación con `X-Total-Count` |
| `src/test/auth.test.tsx` | 9 | Rutas protegidas, permisos por rol, login correcto e incorrecto, menú según el rol y cierre de sesión |
| `src/test/gestion.test.tsx` | 10 | Tabla con paginación de 12, alta, edición con registro completo, errores de validación, cancelación y preferencias de clientes |
| `src/test/paneles.test.tsx` | 5 | Dashboard, reporte de sostenibilidad, plan de compensación y registro de compensación por el ADMIN |
| `src/test/rutas.test.tsx` | 7 | Generar rutas, pedidos sin asignar, re-optimización, errores, vista del conductor y dibujo del mapa |

**43 pruebas aprobadas, 0 fallidas. Cobertura de líneas: 99.7 %** (ramas 94.6 %). Salida completa en
[evidencias/resultado-vitest.txt](evidencias/resultado-vitest.txt).

| Archivo | % Líneas |
|---|:-:|
| api.ts | 100 |
| auth.tsx | 100 |
| CrudPage.tsx | 98.6 |
| Layout.tsx | 100 |
| MapaRutas.tsx | 100 |
| Gestion.tsx | 100 |
| Login.tsx | 100 |
| Paneles.tsx | 100 |
| Rutas.tsx | 100 |

Antes de estas pruebas la cobertura era 10.7 %; se agregaron 38 pruebas para que el Quality Gate de SonarQube
(cobertura ≥ 80 %) se cumpla. Las pantallas también se recorren en el navegador real con las pruebas E2E del Anexo C.

[← Volver al README Principal](../../README.md)
