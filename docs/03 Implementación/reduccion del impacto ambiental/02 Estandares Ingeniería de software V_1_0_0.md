# Estándares de ingeniería de software y guía de desarrollo verde

| Campo | Valor |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla |
| Organización | DistriRápido S.A.C. - Huancayo, Junín |
| Curso | Taller de Proyectos 2 - Universidad Continental |
| Entregable | Inspección 04 - Green IT |
| Versión | 1.0.0 |
| Fecha | 13/11/2026 |
| Elaborado por | Fernando Rodrigo Chaupis Espinoza |
| Revisado por | Docente: Daniel Gamarra Moreno |

---

## 2.1 Estándares aplicados

### ISO/IEC 25010

Modelo de calidad del producto de software. Las optimizaciones de esta inspección atacan sobre todo la
característica **Eficiencia de desempeño**:

| Subcaracterística | Cómo se aplica en EcoLogística |
|---|---|
| Comportamiento temporal | FCP móvil de 2.1 s a 1.4 s; `GET /api/rutas` de 144.8 ms a 19.1 ms |
| Utilización de recursos | 72.5 % menos bytes en el login; JSON comprimido; caché de indicadores |
| Capacidad | Paginación de 12 registros: el tamaño de la respuesta no crece con la cantidad de pedidos |

También aporta a **Mantenibilidad** (código separado por pantalla, módulo de paginación reutilizable) y a
**Usabilidad** (accesibilidad 100 en Lighthouse).

### Green Software Foundation

Aplicamos los principios de la GSF para software verde:

| Principio | Aplicación |
|---|---|
| Eficiencia de carbono | Emitir menos CO₂ por unidad de trabajo: 0.0224 g por visita al login frente a 0.0815 g antes |
| Eficiencia energética | Menos CPU por solicitud: archivos precomprimidos en el build, caché de indicadores, consultas sin N+1 |
| Eficiencia de hardware | Contenedores livianos (`python:3.12-slim`, `nginx:alpine`, `postgres:16-alpine`) |
| Medición | Lighthouse y SWDM en cada cambio con el workflow `green-audit.yml` |
| Green BY software | El motor VRPTW + Green VRP reduce kilómetros y prefiere vehículos de menor emisión |

### W3C WSG 1.0 (Web Sustainability Guidelines)

Numeración según el borrador vigente de las WSG (https://w3c.github.io/sustyweb/).

| Guía WSG | Qué pide | Dónde lo cumplimos |
|---|---|---|
| 2.7 Avoid unnecessary or an overabundance of assets | Evitar recursos de más | Sin imágenes rasterizadas; íconos del mapa en CSS |
| 3.1 Identify relevant technical indicators | Definir indicadores y metas | `lighthouserc.cjs`: performance ≥ 0.9, peso ≤ 500 KB, compresión obligatoria |
| 3.2 Minify your HTML, CSS, and JavaScript | Minificar | Build de Vite (esbuild) |
| 3.3 Use code-splitting within projects | Dividir el código | `React.lazy` por pantalla y chunk de React aparte |
| 3.4 Apply tree shaking to code | Eliminar código no usado | Rollup en el build de producción |
| 3.17 Manage dependencies appropriately | Pocas dependencias y justificadas | 4 dependencias de producción en el frontend |
| 3.18 Include files that are automatically expected | Evitar 404 de favicon y robots | Favicon SVG en línea y `robots.txt` |
| 3.22 Use the latest stable language version | Versiones actuales | React 19, Vite 6, Python 3.12, FastAPI 0.115 |
| 3.23 Take advantage of native features | Usar lo nativo | `fetch`, `Date`, inputs nativos, CSS propio |
| 3.24 Run fewer, simpler queries as possible | Menos consultas | `selectinload` (sin N+1), `load_only`, índices |
| 4.2 Optimize browser caching | Caché del navegador | `immutable` para `/assets/`, ETag + 304 en la API |
| 4.3 Compress your files | Comprimir | Brotli y Gzip en el frontend; Gzip en la API |

## 2.2 Guía de desarrollo verde

Estas reglas son obligatorias para todo el equipo al agregar código nuevo.

### Backend (FastAPI, SQLAlchemy, PostgreSQL)

1. Todo listado nuevo usa `paginar()` de `app/api/paginacion.py`. Nunca devolver una tabla completa.
2. Los listados usan un esquema de resumen con solo las columnas que se muestran (`load_only`).
3. Si la respuesta incluye relaciones, cargarlas con `selectinload` para evitar consultas N+1.
4. Toda llave foránea y todo campo usado en filtros (`estado`, `fecha`) lleva `index=True`.
5. Cálculos agregados costosos (indicadores, reportes) se guardan con `cache.obtener()`.
6. No desactivar `GZipMiddleware` ni el middleware de ETag en `main.py`.
7. El motor de rutas siempre se ejecuta con límite de tiempo (`SOLVER_TIME_LIMIT_S`).

### Frontend (React, TypeScript, Vite)

1. Cada pantalla nueva se registra con `React.lazy` en `main.tsx`.
2. Antes de instalar una librería, revisar si existe una API nativa (`fetch`, `Intl`, `Array`, `URLSearchParams`).
3. Las imágenes que se agreguen deben ser SVG o WebP/AVIF con `loading="lazy"` y `width`/`height` definidos.
4. Íconos pequeños en SVG en línea o CSS, no como archivos aparte.
5. Las tablas usan `CrudPage` o `apiPaginado()`: nunca pedir todos los registros.
6. Revisar el resumen "Peso del build" del workflow en cada Pull Request.

### Integración continua

El workflow `.github/workflows/green-audit.yml` corre en cada push a `main` y en cada Pull Request:

1. Compila el frontend (`npm run build`), que genera los `.br` y `.gz`.
2. Publica el peso de cada archivo en el resumen del job.
3. Ejecuta Lighthouse CI tres veces sobre el login con `frontend/lighthouserc.cjs`.
4. Falla si el performance o la accesibilidad bajan de 90, si el peso supera 500 KB o si falta compresión.

## 2.3 Integración continua y versiones

| Herramienta | Versión |
|---|---|
| Lighthouse | 12.6.1 |
| Lighthouse CI | 0.14.0 |
| Node.js | 22 |
| Python | 3.12 |
| Vite | 6.3.2 |
| FastAPI | 0.115.12 |

### Secuencia Git usada para versionar este entregable

```powershell
git status
git pull origin main
git add backend/app backend/tests
git commit -m "perf(api): paginacion, consultas magras, gzip, etag y cache de indicadores"
git add frontend
git commit -m "perf(frontend): lazy loading por pantalla, chunk de react, precompresion br/gz y svg en linea"
git add .github/workflows/green-audit.yml frontend/lighthouserc.cjs
git commit -m "ci: auditoria green it con lighthouse ci"
git add "docs/03 Implementación/reduccion del impacto ambiental/"
git commit -m "docs(green-it): informe de reduccion del impacto ambiental y estandares de ingenieria"
git push origin main
```

## 2.4 Matriz de las ocho optimizaciones

| # | Optimización | ISO/IEC 25010 | GSF | WSG 1.0 | Resultado medido |
|:-:|---|---|---|---|---|
| 1 | Consultas magras e índices | Utilización de recursos | Eficiencia energética | 3.24 | `/api/rutas` 144.8 ms a 19.1 ms |
| 2 | Paginación de 12 registros | Capacidad | Eficiencia de carbono | 3.24 | `/api/pedidos` 75 526 B a 267 B |
| 3 | Imágenes WebP / AVIF | Utilización de recursos | Eficiencia de carbono | 2.7 | 0 imágenes rasterizadas; íconos en CSS/SVG |
| 4 | Code splitting (React.lazy) | Comportamiento temporal | Eficiencia de carbono | 3.3, 3.4 | JS de la app 232 KB a 7.2 KB en el login |
| 5 | Bibliotecas pesadas y API nativa | Utilización de recursos | Eficiencia de hardware | 3.17, 3.23 | 4 dependencias de producción en el frontend |
| 6 | SVG en línea / menos solicitudes | Comportamiento temporal | Eficiencia de carbono | 3.18 | Solicitud a `favicon.ico` eliminada |
| 7 | Caché en servidor y en cliente | Comportamiento temporal | Eficiencia energética | 4.2 | Segunda visita 1 252 B; API responde 304; indicadores 19.2 ms a 3.1 ms |
| 8 | Compresión Brotli y Gzip | Utilización de recursos | Eficiencia de carbono | 4.3 | Login 242 795 B a 66 697 B (-72.5 %) |

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Chaupis | Estándares, guía de desarrollo verde y matriz de optimizaciones de la Inspección 04 |
