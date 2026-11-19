[← Volver al README Principal](../../README.md)

# Registro de incidentes

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

| ID | Fecha | Incidente (entorno) | Impacto | Causa raíz | Solución | Estado |
|---|---|---|---|---|---|---|
| INC-01 | 13/11/2026 | El workflow CI falló al leerse (sintaxis YAML) | El CI no corrió para el commit `65b250a` | Un `:` seguido de espacio en `--only-binary :all:` dentro de un comando sin comillas | Comando entre comillas (commit `eb62952`) | Cerrado |
| INC-02 | 13/11/2026 | Docker Desktop no levantó su motor en la máquina de desarrollo | No se pudo ejecutar SonarQube local | Servicio de Docker sin iniciar el motor Linux | Análisis movido a SonarQube Cloud | Cerrado |

[← Volver al README Principal](../../README.md)
