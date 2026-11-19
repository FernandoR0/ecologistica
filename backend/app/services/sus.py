"""ENB-007 · Cálculo del System Usability Scale (Brooke, 1996) y su clasificación.

- Ítems impares (positivos): aporte = respuesta − 1.
- Ítems pares (negativos): aporte = 5 − respuesta.
- Puntaje = suma de aportes × 2,5 (escala 0 a 100).
- Grado y adjetivo según la escala curvada de Sauro y Lewis (2016) y Bangor et al. (2009).
"""

PREGUNTAS = (
    "Creo que me gustaría usar este sistema con frecuencia.",
    "Encontré el sistema innecesariamente complejo.",
    "Pensé que el sistema era fácil de usar.",
    "Creo que necesitaría el apoyo de un técnico para poder usar este sistema.",
    "Encontré que las distintas funciones del sistema estaban bien integradas.",
    "Pensé que había demasiada inconsistencia en el sistema.",
    "Imagino que la mayoría de las personas aprendería a usar este sistema muy rápido.",
    "Encontré el sistema muy engorroso de usar.",
    "Me sentí muy seguro usando el sistema.",
    "Necesité aprender muchas cosas antes de poder usar el sistema.",
)

UMBRAL_ACEPTACION = 68.0

# (puntaje mínimo, grado) de la escala curvada de Sauro y Lewis
GRADOS = ((84.1, "A+"), (80.8, "A"), (78.9, "A-"), (77.2, "B+"), (74.1, "B"), (72.6, "B-"),
          (71.1, "C+"), (65.0, "C"), (62.7, "C-"), (51.7, "D"), (0.0, "F"))
# (puntaje mínimo, adjetivo) de Bangor, Kortum y Miller
ADJETIVOS = ((85.5, "Excelente"), (72.6, "Bueno"), (52.1, "Aceptable (OK)"), (38.0, "Pobre"), (0.0, "Muy pobre"))


def aportes(respuestas: list[int]) -> list[int]:
    if len(respuestas) != 10 or any(not 1 <= r <= 5 for r in respuestas):
        raise ValueError("El SUS requiere 10 respuestas entre 1 y 5")
    return [(r - 1) if i % 2 == 0 else (5 - r) for i, r in enumerate(respuestas)]


def puntaje_sus(respuestas: list[int]) -> float:
    return sum(aportes(respuestas)) * 2.5


def grado(puntaje: float) -> str:
    return next(g for minimo, g in GRADOS if puntaje >= minimo)


def adjetivo(puntaje: float) -> str:
    return next(a for minimo, a in ADJETIVOS if puntaje >= minimo)


def resumen(lista_respuestas: list[list[int]]) -> dict:
    puntajes = [puntaje_sus(r) for r in lista_respuestas]
    promedio = round(sum(puntajes) / len(puntajes), 2) if puntajes else 0.0
    return {
        "n": len(puntajes),
        "puntajes": puntajes,
        "promedio": promedio,
        "grado": grado(promedio) if puntajes else "-",
        "adjetivo": adjetivo(promedio) if puntajes else "-",
        "aprobado": promedio >= UMBRAL_ACEPTACION if puntajes else False,
        "promedio_por_item": [
            round(sum(r[i] for r in lista_respuestas) / len(lista_respuestas), 2) for i in range(10)
        ] if lista_respuestas else [],
    }
