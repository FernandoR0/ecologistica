"""DTOs de entrada/salida validados con Pydantic (OWASP A03: validación de entradas)."""

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.optimization.geo import hora_a_min

Hora = Annotated[str, Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$", examples=["08:00"])]
Rol = Literal["ADMIN", "PLANIFICADOR", "CONDUCTOR"]
Combustible = Literal["DIESEL", "GASOLINA", "GLP", "GNV", "ELECTRICO"]
# Rango aproximado del Valle del Mantaro
Lat = Annotated[float, Field(ge=-12.40, le=-11.70)]
Lng = Annotated[float, Field(ge=-75.50, le=-75.00)]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class LoginIn(BaseModel):
    correo: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UsuarioIn(BaseModel):
    correo: EmailStr
    nombre: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8, max_length=72)
    rol: Rol = "PLANIFICADOR"


class UsuarioOut(ORM):
    id: int
    correo: str
    nombre: str
    rol: str
    activo: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"  # noqa: S105
    usuario: UsuarioOut


# ---------- Vehículos (RF-001) ----------
class VehiculoIn(BaseModel):
    placa: str = Field(pattern=r"^[A-Z0-9]{3}-?[A-Z0-9]{3}$", examples=["ABC-123"])
    tipo: str = Field(default="Furgoneta", max_length=40)
    capacidad_kg: float = Field(gt=0, le=20000)
    combustible: Combustible = "DIESEL"
    consumo_100km: float = Field(gt=0, le=100)
    activo: bool = True


class VehiculoUpdate(BaseModel):
    tipo: str | None = None
    capacidad_kg: float | None = Field(default=None, gt=0, le=20000)
    combustible: Combustible | None = None
    consumo_100km: float | None = Field(default=None, gt=0, le=100)
    activo: bool | None = None


class VehiculoOut(ORM, VehiculoIn):
    id: int
    placa: str


# ---------- Conductores (RF-008) ----------
class ConductorIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=120)
    dni: str = Field(pattern=r"^\d{8}$")
    licencia: str = Field(min_length=5, max_length=20)
    telefono: str | None = Field(default=None, pattern=r"^9\d{8}$")
    hora_inicio: Hora = "08:00"
    jornada_max_min: int = Field(default=480, ge=60, le=600)
    vehiculo_id: int | None = None
    usuario_id: int | None = None
    activo: bool = True


class ConductorUpdate(BaseModel):
    nombre: str | None = None
    licencia: str | None = None
    telefono: str | None = Field(default=None, pattern=r"^9\d{8}$")
    hora_inicio: Hora | None = None
    jornada_max_min: int | None = Field(default=None, ge=60, le=600)
    vehiculo_id: int | None = None
    usuario_id: int | None = None
    activo: bool | None = None


class ConductorOut(ORM, ConductorIn):
    id: int


# ---------- Preferencias (RF-009) ----------
class PreferenciaIn(BaseModel):
    hora_desde: Hora
    hora_hasta: Hora
    dias: str = Field(default="1,2,3,4,5,6", pattern=r"^[1-7](,[1-7])*$")
    notas: str | None = Field(default=None, max_length=250)

    @model_validator(mode="after")
    def _rango(self):
        if hora_a_min(self.hora_desde) >= hora_a_min(self.hora_hasta):
            raise ValueError("hora_desde debe ser menor que hora_hasta")
        return self


class PreferenciaOut(ORM, PreferenciaIn):
    id: int
    cliente: str


# ---------- Pedidos (RF-002) ----------
class PedidoIn(BaseModel):
    codigo: str = Field(min_length=3, max_length=20)
    cliente: str = Field(min_length=2, max_length=120)
    direccion: str = Field(min_length=3, max_length=200)
    distrito: str | None = Field(default=None, max_length=60)
    lat: Lat
    lng: Lng
    peso_kg: float = Field(gt=0, le=5000)
    ventana_inicio: Hora = "08:00"
    ventana_fin: Hora = "18:00"
    prioridad: int = Field(default=2, ge=1, le=3)

    @model_validator(mode="after")
    def _ventana(self):
        if hora_a_min(self.ventana_inicio) >= hora_a_min(self.ventana_fin):
            raise ValueError("ventana_inicio debe ser menor que ventana_fin")
        return self


class PedidoUpdate(BaseModel):
    cliente: str | None = None
    direccion: str | None = None
    distrito: str | None = None
    lat: Lat | None = None
    lng: Lng | None = None
    peso_kg: float | None = Field(default=None, gt=0, le=5000)
    ventana_inicio: Hora | None = None
    ventana_fin: Hora | None = None
    prioridad: int | None = Field(default=None, ge=1, le=3)
    estado: Literal["PENDIENTE", "ENTREGADO", "CANCELADO"] | None = None


class PedidoOut(ORM, PedidoIn):
    id: int
    estado: str


# ---------- Rutas (RF-003, RF-004, RF-007) ----------
class OptimizarIn(BaseModel):
    fecha: date | None = None
    pedido_ids: list[int] | None = Field(default=None, description="Vacío = todos los PENDIENTE")
    limite_segundos: int = Field(default=30, ge=1, le=120)


class ParadaOut(ORM):
    id: int
    orden: int
    hora_llegada: str
    estado: str
    pedido: PedidoOut


class RutaOut(ORM):
    id: int
    fecha: date
    vehiculo: VehiculoOut
    conductor: ConductorOut | None
    hora_inicio: str
    hora_fin: str
    distancia_km: float
    duracion_min: int
    co2_kg: float
    distancia_base_km: float
    co2_base_kg: float
    estado: str
    ruta_origen_id: int | None
    paradas: list[ParadaOut]


class ResultadoPlanOut(BaseModel):
    estado: str
    rutas: list[RutaOut]
    no_asignados: list[int]
    distancia_total_km: float
    co2_total_kg: float
    ahorro_km: float
    ahorro_co2_kg: float
    tiempo_calculo_ms: int


class IncidenteIn(BaseModel):
    tipo: Literal["TRAFICO", "BLOQUEO_VIA", "CLIMA", "AVERIA_VEHICULO"]
    hora_actual: Hora
    demora_min: int = Field(default=0, ge=0, le=480)
    paradas_completadas: list[int] = Field(default_factory=list, description="IDs de pedido ya entregados")
    descripcion: str | None = Field(default=None, max_length=250)


class EstadoRutaIn(BaseModel):
    estado: Literal["PLANIFICADA", "EN_CURSO", "COMPLETADA"]


# ---------- Compensación (RF-010) ----------
class CompensacionIn(BaseModel):
    fecha: date
    accion: str = Field(min_length=3, max_length=150)
    proveedor: str | None = Field(default=None, max_length=120)
    co2_kg: float = Field(gt=0)
    costo_soles: float = Field(default=0, ge=0)


class CompensacionOut(ORM, CompensacionIn):
    id: int
