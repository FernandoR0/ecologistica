[← Volver al README Principal](../../README.md)

# Informe técnico integral

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

## 1. Arquitectura
Monorepo con `backend/` (FastAPI) y `frontend/` (React). El motor de optimización (`app/optimization`) es un
módulo puro: recibe una `Instancia` (depósito, pedidos, vehículos) y devuelve un `Plan`. Se prueba sin BD.

## 2. Modelo matemático (VRPTW + Green VRP)
- Conjunto de nodos: depósito 0, (origen opcional) y pedidos i = 1..n con demanda qᵢ y ventana [aᵢ, bᵢ].
- Vehículos k con capacidad Qₖ, emisión eₖ (kg CO₂/km) y jornada Tₖ.
- **Objetivo:** min Σₖ Σ₍ᵢ,ⱼ₎ dᵢⱼ · (1 + λ · eₖ / e_max) · xᵢⱼₖ + Σᵢ penalización(prioridadᵢ) · (pedido i no atendido)
- **Restricciones:** capacidad Σ qᵢ ≤ Qₖ; tiempo de llegada tᵢ ∈ [aᵢ, bᵢ]; duración de ruta ≤ Tₖ.
- **Solución:** OR-Tools Routing, solución inicial *Path Cheapest Arc* + metaheurística **Búsqueda Tabú** (una de las tres que pide la consigna)
  con límite de tiempo.

## 3. Re-optimización
La ruta afectada conserva sus paradas entregadas; las pendientes se replanifican desde la última posición
(tráfico/bloqueo/clima) o se reparten entre vehículos libres (avería). La nueva ruta guarda `ruta_origen_id`.

## 4. Resultados
| Prueba | Resultado |
|---|---|
| Datos demo (20 pedidos, 3 vehículos) | 28.1 km optimizados vs 55.8 km línea base (-49.7 %); 5.4 vs 12.6 kg CO₂ (-57 %) |
| Carga (150 pedidos, 15 vehículos) | 30 s, 0 pedidos sin asignar |
| Cobertura backend | 90 % |
| SUS | _Completar_ |

## 5. Limitaciones y trabajo futuro
- Distancias aproximadas (Haversine × 1.3): integrar OSRM o la matriz de distancias de una API vial.
- Geocodificación de direcciones (Nominatim).
- Rastreo GPS en tiempo real del vehículo.

[← Volver al README Principal](../../README.md)
