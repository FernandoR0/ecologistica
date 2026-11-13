"""Entidades persistentes del sistema."""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

ROLES = ("ADMIN", "PLANIFICADOR", "CONDUCTOR")
COMBUSTIBLES = ("DIESEL", "GASOLINA", "GLP", "GNV", "ELECTRICO")
ESTADOS_PEDIDO = ("PENDIENTE", "PLANIFICADO", "ENTREGADO", "CANCELADO")
ESTADOS_RUTA = ("PLANIFICADA", "EN_CURSO", "COMPLETADA", "REOPTIMIZADA")


class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    correo: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(100))
    rol: Mapped[str] = mapped_column(String(20), default="PLANIFICADOR")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Vehiculo(Base):
    """RF-001 · Unidad de la flota."""

    __tablename__ = "vehiculos"
    id: Mapped[int] = mapped_column(primary_key=True)
    placa: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    tipo: Mapped[str] = mapped_column(String(40), default="Furgoneta")
    capacidad_kg: Mapped[float] = mapped_column(Float)
    combustible: Mapped[str] = mapped_column(String(12), default="DIESEL")
    # Litros/100 km (kWh/100 km si es eléctrico)
    consumo_100km: Mapped[float] = mapped_column(Float)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Conductor(Base):
    """RF-008 · Conductor y vehículo asignado."""

    __tablename__ = "conductores"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    dni: Mapped[str] = mapped_column(String(8), unique=True)
    licencia: Mapped[str] = mapped_column(String(20))
    telefono: Mapped[str | None] = mapped_column(String(15), nullable=True)
    hora_inicio: Mapped[str] = mapped_column(String(5), default="08:00")
    jornada_max_min: Mapped[int] = mapped_column(Integer, default=480)
    vehiculo_id: Mapped[int | None] = mapped_column(ForeignKey("vehiculos.id"), nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    vehiculo: Mapped[Vehiculo | None] = relationship()


class PreferenciaCliente(Base):
    """RF-009 · Horario en que un cliente (bodega, restaurante…) prefiere recibir."""

    __tablename__ = "preferencias_cliente"
    id: Mapped[int] = mapped_column(primary_key=True)
    cliente: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hora_desde: Mapped[str] = mapped_column(String(5))
    hora_hasta: Mapped[str] = mapped_column(String(5))
    dias: Mapped[str] = mapped_column(String(20), default="1,2,3,4,5,6")  # ISO: 1=lunes
    notas: Mapped[str | None] = mapped_column(String(250), nullable=True)


class Pedido(Base):
    """RF-002 · Entrega a realizar."""

    __tablename__ = "pedidos"
    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    cliente: Mapped[str] = mapped_column(String(120), index=True)
    direccion: Mapped[str] = mapped_column(String(200))
    distrito: Mapped[str | None] = mapped_column(String(60), nullable=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    peso_kg: Mapped[float] = mapped_column(Float)
    ventana_inicio: Mapped[str] = mapped_column(String(5), default="08:00")
    ventana_fin: Mapped[str] = mapped_column(String(5), default="18:00")
    prioridad: Mapped[int] = mapped_column(Integer, default=2)  # 1 alta · 2 media · 3 baja
    estado: Mapped[str] = mapped_column(String(12), default="PENDIENTE", index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Ruta(Base):
    """RF-003 · Ruta optimizada asignada a un vehículo y conductor."""

    __tablename__ = "rutas"
    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[date] = mapped_column(Date, index=True)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("vehiculos.id"))
    conductor_id: Mapped[int | None] = mapped_column(ForeignKey("conductores.id"), nullable=True)
    hora_inicio: Mapped[str] = mapped_column(String(5))
    hora_fin: Mapped[str] = mapped_column(String(5))
    distancia_km: Mapped[float] = mapped_column(Float)
    duracion_min: Mapped[int] = mapped_column(Integer)
    co2_kg: Mapped[float] = mapped_column(Float)
    # Línea base: mismas paradas en el orden de registro (sin optimizar)
    distancia_base_km: Mapped[float] = mapped_column(Float)
    co2_base_kg: Mapped[float] = mapped_column(Float)
    estado: Mapped[str] = mapped_column(String(12), default="PLANIFICADA")
    ruta_origen_id: Mapped[int | None] = mapped_column(ForeignKey("rutas.id"), nullable=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    vehiculo: Mapped[Vehiculo] = relationship()
    conductor: Mapped[Conductor | None] = relationship()
    paradas: Mapped[list["Parada"]] = relationship(
        back_populates="ruta", order_by="Parada.orden", cascade="all, delete-orphan"
    )


class Parada(Base):
    __tablename__ = "paradas"
    id: Mapped[int] = mapped_column(primary_key=True)
    ruta_id: Mapped[int] = mapped_column(ForeignKey("rutas.id"))
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"))
    orden: Mapped[int] = mapped_column(Integer)
    hora_llegada: Mapped[str] = mapped_column(String(5))
    estado: Mapped[str] = mapped_column(String(12), default="PENDIENTE")  # PENDIENTE · ENTREGADA

    ruta: Mapped[Ruta] = relationship(back_populates="paradas")
    pedido: Mapped[Pedido] = relationship()


class Compensacion(Base):
    """RF-010 · Acción de compensación de carbono registrada."""

    __tablename__ = "compensaciones"
    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[date] = mapped_column(Date)
    accion: Mapped[str] = mapped_column(String(150))
    proveedor: Mapped[str | None] = mapped_column(String(120), nullable=True)
    co2_kg: Mapped[float] = mapped_column(Float)
    costo_soles: Mapped[float] = mapped_column(Float, default=0)
