"""Fecha y hora de operación en Huancayo.

El servidor de producción corre en UTC: desde las 19:00 de Huancayo `date.today()` ya devuelve el día siguiente y
las reglas del día (restricción de placa, días de atención del cliente) se aplicarían al día equivocado.
Perú no usa horario de verano, así que basta un desfase fijo de -5 horas.
"""

from datetime import date, datetime, timedelta, timezone

LIMA = timezone(timedelta(hours=-5), "America/Lima")


def ahora() -> datetime:
    return datetime.now(LIMA)


def hoy() -> date:
    return ahora().date()


def hora_actual() -> str:
    return ahora().strftime("%H:%M")
