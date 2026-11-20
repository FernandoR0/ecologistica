"""DTOs de entrada/salida validados con Pydantic (OWASP A03: validación de entradas)."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.optimization.geo import hora_a_min

Hora = Annotated[str, Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$", examples=["08:00"])]
Rol = Literal["ADMIN", "PLANIFICADOR", "CONDUCTOR", "AUDITOR"]
TipoVehiculo = Literal["CAMIONETA", "FURGON", "MOTO"]
Combustible = Literal["DIESEL", "GASOLINA", "GLP", "GNV", "ELECTRICO"]
Prioridad = Literal["EXPRESS", "ESTANDAR", "ECONOMICO"]
TipoProducto = Literal["PERECEDERO", "NO_PERECEDERO"]
CategoriaLicencia = Literal["A-I", "A-IIa", "A-IIb", "A-IIIa", "A-IIIb", "A-IIIc", "B-IIb", "B-IIc"]
Distrito = Literal["Huancayo", "El Tambo", "Chilca"]
# Área de operación: Huancayo Metropolitano (Huancayo, El Tambo y Chilca)
Lat = Annotated[float, Field(ge=-12.15, le=-11.98)]
Lng = Annotated[float, Field(ge=-75.30, le=-75.12)]
Dias = Annotated[str, Field(pattern=r"^(LU|MA|MI|JU|VI|SA|DO)(,(LU|MA|MI|JU|VI|SA|DO))*$")]

HORA_MIN_OPERACION, HORA_MAX_OPERACION = 5 * 60, 22 * 60


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def _rango(desde: str | None, hasta: str | None, mensaje: str) -> None:
    if desde and hasta and hora_a_min(desde) >= hora_a_min(hasta):
        raise ValueError(mensaje)


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


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=120)
    rol: Rol | None = None
    activo: bool | None = None


# ---------- Vehículos (RF-001) ----------
class VehiculoIn(BaseModel):
    placa: str = Field(pattern=r"^[A-Z0-9]{3}-?[A-Z0-9]{3}$", examples=["ABC-123"])
    tipo: TipoVehiculo = "CAMIONETA"
    capacidad_kg: float = Field(gt=0, le=20000)
    volumen_m3: float = Field(default=6.0, gt=0, le=60)
    combustible: Combustible = "DIESEL"
    rendimiento: float = Field(gt=0, le=200, description="km/L, km/m³ (GNV) o km/kWh (eléctrico)")
    anio_fabricacion: int = Field(default=2018, ge=1980, le=2100)
    valor_adquisicion_soles: float = Field(default=0, ge=0)
    seguro_anual_soles: float = Field(default=0, ge=0)
    activo: bool = True


class VehiculoUpdate(BaseModel):
    tipo: TipoVehiculo | None = None
    capacidad_kg: float | None = Field(default=None, gt=0, le=20000)
    volumen_m3: float | None = Field(default=None, gt=0, le=60)
    combustible: Combustible | None = None
    rendimiento: float | None = Field(default=None, gt=0, le=200)
    anio_fabricacion: int | None = Field(default=None, ge=1980, le=2100)
    valor_adquisicion_soles: float | None = Field(default=None, ge=0)
    seguro_anual_soles: float | None = Field(default=None, ge=0)
    activo: bool | None = None


class VehiculoOut(ORM, VehiculoIn):
    id: int
    placa: str
    factor_emision_kg_km: float
    antiguedad_anios: int = 0
    restringido_centro: bool = False

    @model_validator(mode="before")
    @classmethod
    def _derivados(cls, obj):
        if hasattr(obj, "antiguedad"):
            return {
                **{k: getattr(obj, k) for k in obj.__table__.columns.keys()},
                "antiguedad_anios": obj.antiguedad(),
                "restringido_centro": obj.restringido_en_centro(),
            }
        return obj


# ---------- Conductores (RF-008) ----------
class ConductorIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=120)
    dni: str = Field(pattern=r"^\d{8}$")
    licencia: str = Field(min_length=5, max_length=20)
    categoria_licencia: CategoriaLicencia = "A-IIb"
    anios_experiencia: int = Field(default=0, ge=0, le=60)
    telefono: str | None = Field(default=None, pattern=r"^9\d{8}$")
    disponible_desde: Hora = "07:00"
    disponible_hasta: Hora = "17:00"
    jornada_max_min: int = Field(default=480, ge=60, le=600)
    vehiculo_id: int | None = None
    usuario_id: int | None = None
    partida_lat: Lat | None = None
    partida_lng: Lng | None = None
    activo: bool = True

    @model_validator(mode="after")
    def _disponibilidad(self):
        _rango(self.disponible_desde, self.disponible_hasta, "La disponibilidad debe terminar después de empezar")
        return self


class ConductorUpdate(BaseModel):
    nombre: str | None = None
    licencia: str | None = None
    categoria_licencia: CategoriaLicencia | None = None
    anios_experiencia: int | None = Field(default=None, ge=0, le=60)
    telefono: str | None = Field(default=None, pattern=r"^9\d{8}$")
    disponible_desde: Hora | None = None
    disponible_hasta: Hora | None = None
    jornada_max_min: int | None = Field(default=None, ge=60, le=600)
    vehiculo_id: int | None = None
    usuario_id: int | None = None
    partida_lat: Lat | None = None
    partida_lng: Lng | None = None
    activo: bool | None = None

    @model_validator(mode="after")
    def _disponibilidad(self):
        _rango(self.disponible_desde, self.disponible_hasta, "La disponibilidad debe terminar después de empezar")
        return self


class ConductorOut(ORM, ConductorIn):
    id: int


# ---------- Clientes (RF-009) ----------
class ClienteIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=150)
    telefono: str | None = Field(default=None, pattern=r"^9\d{8}$|^0\d{6,8}$")
    direccion: str = Field(min_length=3, max_length=200)
    distrito: Distrito
    punto_referencia: str | None = Field(default=None, max_length=200, examples=["Frente a la bodega El Ahorro"])
    restricciones_acceso: str | None = Field(default=None, max_length=200, examples=["No ingresar por Calle Real"])
    hora_desde: Hora = "06:00"
    hora_hasta: Hora = "21:00"
    dias_atencion: Dias = "LU,MA,MI,JU,VI,SA"
    lat: Lat
    lng: Lng
    activo: bool = True

    @model_validator(mode="after")
    def _horario(self):
        ini, fin = hora_a_min(self.hora_desde), hora_a_min(self.hora_hasta)
        if ini >= fin or ini < HORA_MIN_OPERACION or fin > HORA_MAX_OPERACION:
            raise ValueError("Horario fuera del rango operativo (05:00-22:00)")
        return self


class ClienteUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=150)
    telefono: str | None = Field(default=None, pattern=r"^9\d{8}$|^0\d{6,8}$")
    direccion: str | None = Field(default=None, min_length=3, max_length=200)
    distrito: Distrito | None = None
    punto_referencia: str | None = Field(default=None, max_length=200)
    restricciones_acceso: str | None = Field(default=None, max_length=200)
    hora_desde: Hora | None = None
    hora_hasta: Hora | None = None
    dias_atencion: Dias | None = None
    lat: Lat | None = None
    lng: Lng | None = None
    activo: bool | None = None

    @model_validator(mode="after")
    def _horario(self):
        _rango(self.hora_desde, self.hora_hasta, "Horario fuera del rango operativo (05:00-22:00)")
        return self


class ClienteOut(ORM, ClienteIn):
    id: int


# ---------- Pedidos (RF-002) ----------
class PedidoIn(BaseModel):
    codigo: str | None = Field(
        default=None, min_length=3, max_length=20,
        description="Vacío = se genera automáticamente (PED-0001, PED-0002…)",
    )
    cliente_id: int = Field(gt=0)
    direccion: str | None = Field(default=None, min_length=3, max_length=200, description="Vacío = la del cliente")
    punto_referencia: str | None = Field(default=None, max_length=200)
    lat: Lat | None = Field(default=None, description="Vacío = la ubicación del cliente")
    lng: Lng | None = None
    peso_kg: float = Field(gt=0, le=5000)
    volumen_m3: float = Field(default=0, ge=0, le=30)
    ventana_inicio: Hora | None = Field(default=None, description="Vacío = horario preferido del cliente")
    ventana_fin: Hora | None = None
    prioridad: Prioridad = "ESTANDAR"
    tipo_producto: TipoProducto = "NO_PERECEDERO"

    @model_validator(mode="after")
    def _ventana(self):
        _rango(self.ventana_inicio, self.ventana_fin, "La ventana debe terminar después de empezar")
        return self


class PedidoUpdate(BaseModel):
    direccion: str | None = None
    punto_referencia: str | None = None
    lat: Lat | None = None
    lng: Lng | None = None
    peso_kg: float | None = Field(default=None, gt=0, le=5000)
    volumen_m3: float | None = Field(default=None, ge=0, le=30)
    ventana_inicio: Hora | None = None
    ventana_fin: Hora | None = None
    prioridad: Prioridad | None = None
    tipo_producto: TipoProducto | None = None
    estado: Literal["PENDIENTE", "ENTREGADO", "CANCELADO"] | None = None

    @model_validator(mode="after")
    def _ventana(self):
        _rango(self.ventana_inicio, self.ventana_fin, "La ventana debe terminar después de empezar")
        return self


class PedidoOut(ORM):
    id: int
    codigo: str
    cliente_id: int
    cliente_nombre: str
    direccion: str
    punto_referencia: str | None
    lat: float
    lng: float
    peso_kg: float
    volumen_m3: float
    ventana_inicio: str
    ventana_fin: str
    prioridad: str
    tipo_producto: str
    estado: str


class PedidoResumen(ORM):
    """Solo las columnas que se ven en el listado de pedidos."""

    id: int
    codigo: str
    cliente_nombre: str
    peso_kg: float
    volumen_m3: float
    ventana_inicio: str
    ventana_fin: str
    prioridad: str
    tipo_producto: str
    estado: str


class PedidoParada(ORM):
    """Datos del pedido que necesita el mapa, la lista de paradas y el modo conductor."""

    id: int
    codigo: str
    cliente_nombre: str
    direccion: str
    punto_referencia: str | None
    lat: float
    lng: float
    peso_kg: float
    ventana_inicio: str
    ventana_fin: str


# ---------- Rutas (RF-003, RF-004, RF-007) ----------
class OptimizarIn(BaseModel):
    fecha: date | None = None
    pedido_ids: list[int] | None = Field(default=None, description="Vacío = todos los PENDIENTE")
    limite_segundos: int | None = Field(default=None, ge=1, le=120)


class ParadaOut(ORM):
    id: int
    orden: int
    hora_llegada: str
    distancia_tramo_km: float
    tiempo_tramo_min: int
    congestion: str
    fuera_ventana: bool
    estado: str
    pedido: PedidoParada
    entregada_en: datetime | None = None
    con_foto: bool = False


class EvidenciaIn(BaseModel):
    """Foto de la entrega como data URL (el celular la reduce antes de enviarla)."""

    imagen: str = Field(
        min_length=30, max_length=600_000, pattern=r"^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$",
        description="data:image/jpeg;base64,... (máximo ~400 KB)",
    )


class RutaOut(ORM):
    id: int
    fecha: date
    vehiculo: VehiculoOut
    conductor: ConductorOut | None
    hora_inicio: str
    hora_fin: str
    distancia_km: float
    duracion_min: int
    descanso_min: int
    co2_kg: float
    distancia_base_km: float
    co2_base_kg: float
    estado: str
    ruta_origen_id: int | None
    partida_lat: float | None = None
    partida_lng: float | None = None
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
    rutas_reemplazadas: int = Field(default=0, description="Rutas que aún no salían y se volvieron a planificar")


TipoIncidente = Literal[
    "TRAFICO", "ACCIDENTE", "BLOQUEO_VIA", "CLIMA", "AVERIA_VEHICULO", "PEDIDO_NUEVO", "CANCELACION"
]


class IncidenteIn(BaseModel):
    tipo: TipoIncidente
    hora_actual: Hora
    pedido_id: int | None = Field(default=None, description="Pedido nuevo o cancelado (PEDIDO_NUEVO / CANCELACION)")
    demora_min: int = Field(default=0, ge=0, le=480)
    paradas_completadas: list[int] = Field(default_factory=list, description="IDs de pedido ya entregados")
    descripcion: str | None = Field(default=None, max_length=250)

    @model_validator(mode="after")
    def _pedido(self):
        if self.tipo in ("PEDIDO_NUEVO", "CANCELACION") and self.pedido_id is None:
            raise ValueError("pedido_id es obligatorio para PEDIDO_NUEVO y CANCELACION")
        return self


class IncidenteOut(ORM):
    id: int
    ruta_id: int
    ruta_nueva_id: int | None
    tipo: str
    hora: str
    demora_min: int
    pedido_id: int | None
    descripcion: str | None
    creado_en: datetime


class EstadoRutaIn(BaseModel):
    estado: Literal["PLANIFICADA", "EN_CURSO", "COMPLETADA"]


# ---------- Compensación (RF-010) ----------
class CompensacionIn(BaseModel):
    fecha: date
    accion: Literal["REFORESTACION", "BONO_CARBONO"]
    proveedor: str | None = Field(default=None, max_length=150)
    co2_kg: float = Field(gt=0)
    costo_soles: float = Field(default=0, ge=0)


class CompensacionOut(ORM, CompensacionIn):
    id: int


# ---------- Administración (RF-012) ----------
class ConfiguracionIn(BaseModel):
    velocidad_kmh: float = Field(gt=5, le=80)
    velocidad_punta_kmh: float = Field(gt=3, le=80)
    factor_vial: float = Field(ge=1, le=3)
    peso_co2: float = Field(ge=0, le=10)
    servicio_min: int = Field(ge=1, le=60)
    limite_segundos: int = Field(ge=1, le=120)
    precio_diesel_galon: float = Field(gt=0, le=100)
    costo_mantenimiento_km: float = Field(ge=0, le=20)
    digitos_placa_restringidos: str = Field(
        default="", max_length=60, pattern=r"^$|^[1-7]:\d(,\d)*(;[1-7]:\d(,\d)*)*$",
        examples=["1:1,2;3:5,6"],
    )


class ConfiguracionOut(ORM, ConfiguracionIn):
    pass


class AuditoriaOut(ORM):
    id: int
    fecha: datetime
    usuario_id: int | None
    correo: str | None
    accion: str
    recurso: str
    estado_http: int


class ZonaIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    tipo: Literal["RESTRINGIDA", "RIESGO", "SENSIBLE", "DISTRITO"]
    poligono: list[tuple[Lat, Lng]] = Field(min_length=3, max_length=200)
    activa: bool = True


class ZonaOut(ORM):
    id: int
    nombre: str
    tipo: str
    poligono: list[list[float]]
    activa: bool


# ---------- Encuesta SUS (ENB-007) ----------
class RespuestaSusIn(BaseModel):
    codigo_participante: str = Field(pattern=r"^P\d{1,3}$", examples=["P1"])
    perfil: str = Field(min_length=3, max_length=60, examples=["Estudiante de ingeniería, usa apps de reparto"])
    respuestas: list[Annotated[int, Field(ge=1, le=5)]] = Field(min_length=10, max_length=10)
    tareas_completadas: int = Field(default=0, ge=0, le=5)
    comentario: str | None = Field(default=None, max_length=500)


class RespuestaSusOut(ORM, RespuestaSusIn):
    id: int
    creado_en: datetime
    puntaje: float = 0

    @model_validator(mode="before")
    @classmethod
    def _puntaje(cls, obj):
        from app.services.sus import puntaje_sus  # noqa: PLC0415 - evita import circular

        if hasattr(obj, "respuestas"):
            return {
                **{k: getattr(obj, k) for k in obj.__table__.columns.keys()},
                "puntaje": puntaje_sus(obj.respuestas),
            }
        return obj
