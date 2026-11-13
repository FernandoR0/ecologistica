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


def hora_a_min(hora: str) -> int:
    """'08:30' → 510."""
    h, m = hora.split(":")
    return int(h) * 60 + int(m)


def min_a_hora(minutos: int) -> str:
    """510 → '08:30' (se limita a 23:59)."""
    minutos = max(0, min(int(minutos), 23 * 60 + 59))
    return f"{minutos // 60:02d}:{minutos % 60:02d}"
