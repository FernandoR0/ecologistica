# Calidad de código (SonarQube)

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

## Herramientas
- **SonarQube** (`sonar-project.properties` en la raíz): bugs, vulnerabilidades, code smells, duplicación, cobertura.
- **Ruff** (Python) y **ESLint** (TypeScript) en GitHub Actions.
- **pytest-cov** y **Vitest coverage** para cobertura.

## Cómo ejecutar
```bash
cd backend && pytest --cov=app --cov-report=xml
cd frontend && npm test -- --coverage
docker run --rm -e SONAR_HOST_URL=http://host.docker.internal:9000 -e SONAR_TOKEN=<token> -v "$PWD:/usr/src" sonarsource/sonar-scanner-cli
```

## Resultados
| Métrica | Valor | Meta |
|---|---|---|
| Cobertura backend (pytest-cov) | _Completar_ (última ejecución local: 88 %) | ≥ 80 % |
| Bugs | _Completar_ | 0 |
| Vulnerabilidades | _Completar_ | 0 |
| Code smells | _Completar_ | < 50 |
| Duplicación | _Completar_ | < 3 % |
| Quality Gate | _Completar_ | Aprobado |

Adjuntar captura del panel de SonarQube.
