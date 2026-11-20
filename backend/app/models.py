"""Entidades persistentes del sistema (ver docs/01 Inicio/11. Base de datos)."""

from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, LargeBinary, String, event, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.optimization.emisiones import factor_emision_kg_km

ROLES = ("ADMIN", "PLANIFICADOR", "CONDUCTOR", "AUDITOR")
TIPOS_VEHICULO = ("CAMIONETA", "FURGON", "MOTO")
COMBUSTIBLES = ("DIESEL", "GASOLINA", "GLP", "GNV", "ELECTRICO")
PRIORIDADES = ("EXPRESS", "ESTANDAR", "ECONOMICO")
TIPOS_PRODUCTO = ("PERECEDERO", "NO_PERECEDERO")
ESTADOS_PEDIDO = ("PENDIENTE", "PLANIFICADO", "ENTREGADO", "CANCELADO")
ESTADOS_RUTA = ("PLANIFICADA", "EN_CURSO", "COMPLETADA", "REOPTIMIZADA")
TIPOS_ZONA = ("RESTRINGIDA", "RIESGO", "SENSIBLE", "DISTRITO")


class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    correo: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(100))
    rol: Mapped[str] = mapped_column(String(20), default="PLANIFICADOR")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    # RN-001: bloqueo tras intentos fallidos (persistido para que funcione con varias réplicas de la API)
    intentos_fallidos: Mapped[int] = mapped_column(Integer, default=0)
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Vehiculo(Base):
    """RF-001 · Unidad de la flota."""

    __tablename__ = "vehiculos"
    id: Mapped[int] = mapped_column(primary_key=True)
    placa: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    tipo: Mapped[str] = mapped_column(String(12), default="CAMIONETA")
    capacidad_kg: Mapped[float] = mapped_column(Float)
    volumen_m3: Mapped[float] = mapped_column(Float, default=6.0)
    combustible: Mapped[str] = mapped_column(String(12), default="DIESEL")
    # km/L (diésel, gasolina, GLP), km/m³ (GNV) o km/kWh (eléctrico)
    rendimiento: Mapped[float] = mapped_column(Float)
    factor_emision_kg_km: Mapped[float] = mapped_column(Float, default=0)
    anio_fabricacion: Mapped[int] = mapped_column(Integer, default=2018)
    valor_adquisicion_soles: Mapped[float] = mapped_column(Float, default=0)
    seguro_anual_soles: Mapped[float] = mapped_column(Float, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    def antiguedad(self, hoy: date | None = None) -> int:
        return (hoy or date.today()).year - self.anio_fabricacion

    def restringido_en_centro(self, hoy: date | None = None) -> bool:
        """RN-006: diésel con más de 15 años no ingresa a la zona restringida del Centro."""
        return self.combustible == "DIESEL" and self.antiguedad(hoy) > 15


@event.listens_for(Vehiculo, "before_insert")
@event.listens_for(Vehiculo, "before_update")
def _calcular_factor(_mapper, _conn, veh: Vehiculo) -> None:  # RN-009
    veh.factor_emision_kg_km = round(factor_emision_kg_km(veh.combustible, veh.rendimiento), 4)


class Conductor(Base):
    """RF-008 · Conductor, su disponibilidad y el vehículo asignado."""

    __tablename__ = "conductores"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    dni: Mapped[str] = mapped_column(String(8), unique=True)
    licencia: Mapped[str] = mapped_column(String(20))
    categoria_licencia: Mapped[str] = mapped_column(String(6), default="A-IIb")
    anios_experiencia: Mapped[int] = mapped_column(Integer, default=0)
    telefono: Mapped[str | None] = mapped_column(String(15), nullable=True)
    disponible_desde: Mapped[str] = mapped_column(String(5), default="07:00")
    disponible_hasta: Mapped[str] = mapped_column(String(5), default="17:00")
    jornada_max_min: Mapped[int] = mapped_column(Integer, default=480)
    vehiculo_id: Mapped[int | None] = mapped_column(ForeignKey("vehiculos.id"), nullable=True, index=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True, unique=True)
    # Punto de partida propio (por ejemplo, la casa del conductor). Vacío = sale del depósito.
    partida_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    partida_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    vehiculo: Mapped[Vehiculo | None] = relationship()


class Cliente(Base):
    """RF-009 · Cliente (bodega, mercado, restaurante) con sus preferencias de entrega."""

    __tablename__ = "clientes"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), index=True)
    telefono: Mapped[str | None] = mapped_column(String(15), nullable=True)
    direccion: Mapped[str] = mapped_column(String(200))
    distrito: Mapped[str] = mapped_column(String(40))
    punto_referencia: Mapped[str | None] = mapped_column(String(200), nullable=True)
    restricciones_acceso: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hora_desde: Mapped[str] = mapped_column(String(5), default="06:00")
    hora_hasta: Mapped[str] = mapped_column(String(5), default="21:00")
    dias_atencion: Mapped[str] = mapped_column(String(30), default="LU,MA,MI,JU,VI,SA")
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Pedido(Base):
    """RF-002 · Entrega a realizar."""

    __tablename__ = "pedidos"
    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), index=True)
    direccion: Mapped[str] = mapped_column(String(200))
    punto_referencia: Mapped[str | None] = mapped_column(String(200), nullable=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    peso_kg: Mapped[float] = mapped_column(Float)
    volumen_m3: Mapped[float] = mapped_column(Float, default=0)
    ventana_inicio: Mapped[str] = mapped_column(String(5), default="08:00")
    ventana_fin: Mapped[str] = mapped_column(String(5), default="18:00")
    prioridad: Mapped[str] = mapped_column(String(10), default="ESTANDAR")
    tipo_producto: Mapped[str] = mapped_column(String(15), default="NO_PERECEDERO")
    estado: Mapped[str] = mapped_column(String(12), default="PENDIENTE", index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    cliente: Mapped[Cliente] = relationship(lazy="joined")

    @property
    def cliente_nombre(self) -> str:
        return self.cliente.nombre if self.cliente else ""


class Ruta(Base):
    """RF-003 · Ruta optimizada asignada a un vehículo y conductor."""

    __tablename__ = "rutas"
    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[date] = mapped_column(Date, index=True)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("vehiculos.id"), index=True)
    conductor_id: Mapped[int | None] = mapped_column(ForeignKey("conductores.id"), nullable=True, index=True)
    hora_inicio: Mapped[str] = mapped_column(String(5))
    hora_fin: Mapped[str] = mapped_column(String(5))
    distancia_km: Mapped[float] = mapped_column(Float)
    duracion_min: Mapped[int] = mapped_column(Integer)
    co2_kg: Mapped[float] = mapped_column(Float)
    descanso_min: Mapped[int] = mapped_column(Integer, default=0)
    # Línea base: mismas paradas en el orden de registro (ruta secuencial sin optimizar)
    distancia_base_km: Mapped[float] = mapped_column(Float)
    co2_base_kg: Mapped[float] = mapped_column(Float)
    estado: Mapped[str] = mapped_column(String(12), default="PLANIFICADA", index=True)
    ruta_origen_id: Mapped[int | None] = mapped_column(ForeignKey("rutas.id"), nullable=True)
    # Punto desde el que sale la ruta (vacío = depósito)
    partida_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    partida_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    vehiculo: Mapped[Vehiculo] = relationship()
    conductor: Mapped[Conductor | None] = relationship()
    paradas: Mapped[list["Parada"]] = relationship(
        back_populates="ruta", order_by="Parada.orden", cascade="all, delete-orphan"
    )


class Parada(Base):
    __tablename__ = "paradas"
    id: Mapped[int] = mapped_column(primary_key=True)
    ruta_id: Mapped[int] = mapped_column(ForeignKey("rutas.id"), index=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"), index=True)
    orden: Mapped[int] = mapped_column(Integer)
    hora_llegada: Mapped[str] = mapped_column(String(5))
    distancia_tramo_km: Mapped[float] = mapped_column(Float, default=0)
    tiempo_tramo_min: Mapped[int] = mapped_column(Integer, default=0)
    congestion: Mapped[str] = mapped_column(String(8), default="VERDE")  # VERDE · AMARILLO · ROJO
    fuera_ventana: Mapped[bool] = mapped_column(Boolean, default=False)
    estado: Mapped[str] = mapped_column(String(12), default="PENDIENTE")  # PENDIENTE · ENTREGADA

    ruta: Mapped[Ruta] = relationship(back_populates="paradas")
    pedido: Mapped[Pedido] = relationship()
    entrega: Mapped["Entrega | None"] = relationship(
        back_populates="parada", uselist=False, cascade="all, delete-orphan",
    )

    @property
    def entregada_en(self) -> datetime | None:
        return self.entrega.entregada_en if self.entrega else None

    @property
    def con_foto(self) -> bool:
        return bool(self.entrega and self.entrega.foto_tipo)


class Entrega(Base):
    """US-014 · Confirmación de una entrega: hora y foto opcional tomada por el conductor."""

    __tablename__ = "entregas"
    id: Mapped[int] = mapped_column(primary_key=True)
    parada_id: Mapped[int] = mapped_column(ForeignKey("paradas.id"), unique=True, index=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    entregada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    foto_tipo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Se carga solo al pedir la foto: el listado de rutas no trae las imágenes
    foto: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True, deferred=True)

    parada: Mapped[Parada] = relationship(back_populates="entrega")


class Incidente(Base):
    """RF-007 · Evento que obliga a re-optimizar una ruta."""

    __tablename__ = "incidentes"
    id: Mapped[int] = mapped_column(primary_key=True)
    ruta_id: Mapped[int] = mapped_column(ForeignKey("rutas.id"), index=True)
    ruta_nueva_id: Mapped[int | None] = mapped_column(ForeignKey("rutas.id"), nullable=True)
    tipo: Mapped[str] = mapped_column(String(16))
    hora: Mapped[str] = mapped_column(String(5))
    demora_min: Mapped[int] = mapped_column(Integer, default=0)
    pedido_id: Mapped[int | None] = mapped_column(ForeignKey("pedidos.id"), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(String(250), nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Zona(Base):
    """Polígono geográfico: zona restringida del Centro, zona de riesgo, sensible o límite distrital."""

    __tablename__ = "zonas"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    tipo: Mapped[str] = mapped_column(String(12), index=True)
    poligono: Mapped[list] = mapped_column(JSON)  # [[lat, lng], ...]
    activa: Mapped[bool] = mapped_column(Boolean, default=True)


class Compensacion(Base):
    """RF-010 · Acción de compensación de carbono registrada."""

    __tablename__ = "compensaciones"
    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[date] = mapped_column(Date)
    accion: Mapped[str] = mapped_column(String(20))  # REFORESTACION · BONO_CARBONO
    proveedor: Mapped[str | None] = mapped_column(String(150), nullable=True)
    co2_kg: Mapped[float] = mapped_column(Float)
    costo_soles: Mapped[float] = mapped_column(Float, default=0)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)


class Configuracion(Base):
    """RF-012 · Parámetros del motor de rutas que el ADMIN puede ajustar (una sola fila, id = 1)."""

    __tablename__ = "configuracion"
    id: Mapped[int] = mapped_column(primary_key=True)
    velocidad_kmh: Mapped[float] = mapped_column(Float)
    velocidad_punta_kmh: Mapped[float] = mapped_column(Float, default=15.0)
    factor_vial: Mapped[float] = mapped_column(Float)
    peso_co2: Mapped[float] = mapped_column(Float)
    servicio_min: Mapped[int] = mapped_column(Integer)
    limite_segundos: Mapped[int] = mapped_column(Integer)
    precio_diesel_galon: Mapped[float] = mapped_column(Float, default=17.5)
    costo_mantenimiento_km: Mapped[float] = mapped_column(Float, default=1.2)
    # Regla de placa (RN-005): "1:1,2;3:5,6" = lunes dígitos 1 y 2, miércoles 5 y 6. Vacío = sin restricción.
    digitos_placa_restringidos: Mapped[str] = mapped_column(String(60), default="")
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Auditoria(Base):
    """RF-012 · Bitácora de acciones (OWASP A09)."""

    __tablename__ = "auditoria"
    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    correo: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    accion: Mapped[str] = mapped_column(String(10))  # método HTTP o LOGIN
    recurso: Mapped[str] = mapped_column(String(200))
    estado_http: Mapped[int] = mapped_column(Integer)


class RespuestaSus(Base):
    """ENB-007 · Respuesta al cuestionario System Usability Scale (Likert 1 a 5)."""

    __tablename__ = "respuestas_sus"
    id: Mapped[int] = mapped_column(primary_key=True)
    codigo_participante: Mapped[str] = mapped_column(String(10), unique=True)
    perfil: Mapped[str] = mapped_column(String(60))
    respuestas: Mapped[list] = mapped_column(JSON)  # 10 enteros del 1 al 5
    tareas_completadas: Mapped[int] = mapped_column(Integer, default=0)
    comentario: Mapped[str | None] = mapped_column(String(500), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
