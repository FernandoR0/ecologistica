"""Utilidades geográficas y de tiempo puras (sin dependencias externas)."""

import math

RADIO_TIERRA_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia en línea recta entre dos coordenadas (km)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * RADIO_TIERRA_KM * math.asin(math.sqrt(a))


def matriz_distancias_km(puntos: list[tuple[float, float]], factor_vial: float = 1.0) -> list[list[float]]:
    """Matriz simétrica de distancias. `factor_vial` aproxima la distancia por calles."""
    n = len(puntos)
    m = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = haversine_km(*puntos[i], *puntos[j]) * factor_vial
            m[i][j] = m[j][i] = d
    return m


def longitud_recorrido_km(puntos: list[tuple[float, float]], factor_vial: float = 1.0) -> float:
    """Longitud de un recorrido que pasa por los puntos en el orden dado."""
    return sum(haversine_km(*a, *b) for a, b in zip(puntos, puntos[1:], strict=False)) * factor_vial


Poligono = list[tuple[float, float]] | list[list[float]]

# RN-011: horas punta de Huancayo (minutos desde medianoche)
HORAS_PUNTA = ((7 * 60, 9 * 60), (17 * 60, 20 * 60))


def punto_en_poligono(lat: float, lng: float, poligono: Poligono) -> bool:
    """Prueba de inclusión por cruce de rayos (polígono como lista de [lat, lng])."""
    dentro = False
    n = len(poligono)
    for i in range(n):
        y1, x1 = poligono[i][0], poligono[i][1]
        y2, x2 = poligono[(i + 1) % n][0], poligono[(i + 1) % n][1]
        if (y1 > lat) != (y2 > lat):
            x_cruce = x1 + (lat - y1) * (x2 - x1) / (y2 - y1)
            if lng < x_cruce:
                dentro = not dentro
    return dentro


def tramo_cruza(a: tuple[float, float], b: tuple[float, float], poligono: Poligono, muestras: int = 5) -> bool:
    """Aproxima si el tramo recto a→b atraviesa el polígono muestreando puntos intermedios."""
    for k in range(muestras + 1):
        t = k / muestras
        if punto_en_poligono(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, poligono):
            return True
    return False


def es_hora_punta(minuto: int) -> bool:
    return any(ini <= minuto < fin for ini, fin in HORAS_PUNTA)


def velocidad_en(minuto: int, velocidad_kmh: float, velocidad_punta_kmh: float) -> float:
    return velocidad_punta_kmh if es_hora_punta(minuto) else velocidad_kmh


def nivel_congestion(velocidad_kmh: float) -> str:
    """RN-011: verde ≥ 22 km/h, amarillo 16-21 km/h, rojo ≤ 15 km/h."""
    if velocidad_kmh >= 22:
        return "VERDE"
    if velocidad_kmh > 15:
        return "AMARILLO"
    return "ROJO"


def hora_a_min(hora: str) -> int:
    """'08:30' → 510."""
    h, m = hora.split(":")
    return int(h) * 60 + int(m)


def min_a_hora(minutos: int) -> str:
    """510 → '08:30' (se limita a 23:59)."""
    minutos = max(0, min(int(minutos), 23 * 60 + 59))
    return f"{minutos // 60:02d}:{minutos % 60:02d}"
