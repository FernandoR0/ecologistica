"""Cálculo de emisiones de CO₂ (Green VRP · RF-006).

Factores de emisión por unidad de energía consumida (kg CO₂):
- Diésel: 2.68 kg/L · Gasolina: 2.31 kg/L · GLP: 1.51 kg/L · GNV: 2.0 kg/m³
- Eléctrico: 0.20 kg/kWh (factor aproximado de la red eléctrica peruana, SEIN)

Son valores de referencia (IPCC / MINAM). Ajústalos y cita la fuente en
`docs/03 Implementación/reduccion del impacto ambiental/`.
"""

FACTOR_KG_CO2_POR_UNIDAD: dict[str, float] = {
    "DIESEL": 2.68,
    "GASOLINA": 2.31,
    "GLP": 1.51,
    "GNV": 2.0,
    "ELECTRICO": 0.20,
}


def emision_kg_por_km(combustible: str, consumo_100km: float) -> float:
    """kg de CO₂ emitidos por km recorrido."""
    factor = FACTOR_KG_CO2_POR_UNIDAD.get(combustible.upper())
    if factor is None:
        raise ValueError(f"Combustible no soportado: {combustible}")
    return consumo_100km / 100.0 * factor


def co2_kg(distancia_km: float, combustible: str, consumo_100km: float) -> float:
    return round(distancia_km * emision_kg_por_km(combustible, consumo_100km), 3)
