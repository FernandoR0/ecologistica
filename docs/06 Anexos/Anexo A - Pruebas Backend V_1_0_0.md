# Anexo A: Pruebas del backend (pytest)

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

## Resultado
Pegar aquí la salida real de `pytest` (número de pruebas y cobertura).
