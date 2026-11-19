[← Volver al README Principal](../../README.md)

# Anexo A: Pruebas del backend (pytest)

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

## Ejecución
```bash
cd backend
pytest --cov=app --cov-report=term
```

## Casos automatizados
| Archivo | Prueba | Qué verifica |
|---|---|---|
| test_motor.py | test_atiende_todos_los_pedidos_factibles | Todos los pedidos factibles se asignan |
| test_motor.py | test_respeta_capacidad | Ninguna ruta excede la capacidad (RN-01) |
| test_motor.py | test_respeta_ventanas_horarias | Llegadas dentro de la ventana y orden correcto (RN-02) |
| test_motor.py | test_descarta_pedido_imposible_sin_romper_plan | Pedido imposible → no asignado, el resto se planifica (RN-06) |
| test_motor.py | test_green_vrp_prefiere_vehiculo_menos_contaminante | El objetivo Green VRP elige el vehículo eléctrico |
| test_motor.py | test_jornada_maxima_del_conductor | No se excede la jornada (RN-04) |
| test_motor.py | test_reoptimizacion_desde_origen | Re-optimización parte desde la posición actual |
| test_auth.py | login, token inválido, 401, 403, bloqueo | Seguridad (RNF-03 a RNF-05) |
| test_api.py | test_flujo_optimizar_reoptimizar_indicadores | Flujo completo pedido → ruta → incidente → indicadores → compensación |
| test_api.py | test_preferencia_restringe_ventana | La preferencia del cliente restringe la hora de llegada (RN-03) |
| test_api.py | test_averia_reparte_en_otro_vehiculo | Avería reasigna a otro vehículo (RN-10) |
| test_api.py | test_paginacion_de_pedidos | 12 registros por página, cabecera X-Total-Count y columnas resumidas |
| test_api.py | test_gzip_y_etag | Respuesta comprimida con gzip y 304 cuando el ETag no cambió |
| test_api.py | test_filtro_rutas_por_varios_estados | Filtro de rutas vigentes por varios estados |

## Resultado
**27 pruebas aprobadas, 0 fallidas. Cobertura: 90 %.** Salida completa en [evidencias/resultado-pytest.txt](evidencias/resultado-pytest.txt).

### Prueba de carga (RNF-01)

```bash
cd backend
python -m scripts.prueba_carga 30 5
```

| Corrida | Tiempo | Rutas | km | kg CO₂ | Sin asignar |
|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | 30.0 s | 9 | 153.9 | 16.63 | 0 |
| 2 | 30.0 s | 9 | 150.2 | 13.39 | 0 |
| 3 | 30.0 s | 10 | 152.4 | 17.15 | 0 |
| 4 | 30.0 s | 10 | 167.4 | 17.46 | 0 |
| 5 | 30.0 s | 9 | 150.9 | 16.31 | 0 |

P95: **30 s** (meta ≤ 45 s), promedio 155.0 km por plan. El motor usa todo el tiempo límite para seguir mejorando la
solución con la Búsqueda Tabú.

[← Volver al README Principal](../../README.md)
