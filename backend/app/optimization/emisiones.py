"""Emisiones y consumo de combustible (RN-009, Green VRP).

Factores de emisión por unidad de energía (kg CO₂), valores de referencia IPCC 2006 / MINAM:
- Diésel 2,68 kg/L · Gasolina 2,31 kg/L · GLP 1,51 kg/L · GNV 1,93 kg/m³
- Electricidad 0,20 kg/kWh (factor aproximado de la red eléctrica peruana, SEIN)

El rendimiento del vehículo se registra en km por unidad (km/L, km/m³ o km/kWh), como pide el caso.
"""

LITROS_POR_GALON = 3.785

FACTOR_KG_CO2_POR_UNIDAD: dict[str, float] = {
    "DIESEL": 2.68,
    "GASOLINA": 2.31,
    "GLP": 1.51,
    "GNV": 1.93,
    "ELECTRICO": 0.20,
}


def factor_emision_kg_km(combustible: str, rendimiento: float) -> float:
    """kg de CO₂ emitidos por km recorrido = factor del combustible ÷ rendimiento (km por unidad)."""
    factor = FACTOR_KG_CO2_POR_UNIDAD.get(combustible.upper())
    if factor is None:
        raise ValueError(f"Combustible no soportado: {combustible}")
    if rendimiento <= 0:
        raise ValueError("El rendimiento debe ser mayor que 0")
    return factor / rendimiento


def consumo_unidades(distancia_km: float, rendimiento: float) -> float:
    """Unidades de energía consumidas (L, m³ o kWh) para recorrer la distancia."""
    return distancia_km / rendimiento if rendimiento > 0 else 0.0


def co2_kg(distancia_km: float, combustible: str, rendimiento: float) -> float:
    return round(distancia_km * factor_emision_kg_km(combustible, rendimiento), 3)
