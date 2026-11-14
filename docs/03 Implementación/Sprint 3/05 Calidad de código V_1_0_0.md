# Calidad de código (SonarQube)

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

## Herramientas
- **SonarQube** (`sonar-project.properties` en la raíz): bugs, vulnerabilidades, code smells, duplicación, cobertura.
- **Ruff** (Python) y **ESLint** (TypeScript) en GitHub Actions.
- **pytest-cov** y **Vitest coverage** para cobertura.

## Cómo ejecutar
```bash
cd backend && pytest --cov=app --cov-report=xml
cd frontend && npm test -- --coverage
```

El análisis de SonarQube se hace en **SonarQube Cloud** (https://sonarcloud.io/project/overview?id=FernandoR0_ecologistica)
con el workflow `.github/workflows/sonarcloud.yml`: en cada push a `main` corre las pruebas con cobertura y envía
el análisis. Configuración en `sonar-project.properties`.

## Resultados
| Métrica | Valor | Meta |
|---|---|---|
| Cobertura backend (pytest-cov) | **90 %** (27 pruebas) | ≥ 80 % |
| Análisis estático Python (Ruff) | 0 observaciones | 0 |
| Análisis estático TypeScript (ESLint + tsc) | 0 observaciones | 0 |
| Bugs (SonarQube) | _Completar_ | 0 |
| Vulnerabilidades en dependencias de producción (pip-audit / npm audit) | **0** | 0 |
| Code smells (SonarQube) | _Completar_ | < 50 |
| Duplicación (SonarQube) | _Completar_ | < 3 % |
| Quality Gate (SonarQube) | _Completar_ | Aprobado |

Las filas de SonarQube se toman del panel de SonarQube Cloud después del primer análisis. Adjuntar captura del panel.

Salidas completas: `06 Anexos/evidencias/resultado-pytest.txt` y `06 Anexos/evidencias/resultado-vitest.txt`.
