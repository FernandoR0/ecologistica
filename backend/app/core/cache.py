"""Cache en memoria con tiempo de vida para consultas costosas (indicadores).

Se limpia completo cada vez que alguien modifica datos (POST, PUT, PATCH, DELETE),
asi nunca se muestran indicadores desactualizados.
"""

import time
from collections.abc import Callable
from typing import Any

TTL_SEGUNDOS = 60
_datos: dict[tuple, tuple[float, Any]] = {}


def obtener(clave: tuple, calcular: Callable[[], Any], ttl: int = TTL_SEGUNDOS) -> Any:
    ahora = time.monotonic()
    guardado = _datos.get(clave)
    if guardado and ahora - guardado[0] < ttl:
        return guardado[1]
    valor = calcular()
    _datos[clave] = (ahora, valor)
    return valor


def limpiar() -> None:
    _datos.clear()
