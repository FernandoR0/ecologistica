"""Configuración central leída de variables de entorno (.env)."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET = "solo-desarrollo-cambiar-en-produccion-0123456789"  # noqa: S105 - solo para desarrollo


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    DATABASE_URL: str = "sqlite:///./ecologistica.db"
    JWT_SECRET: str = DEV_SECRET
    JWT_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: str = "http://localhost:5173"

    # Depósito de DistriRápido S.A.C. (Huancayo)
    DEPOT_LAT: float = -12.0651
    DEPOT_LNG: float = -75.2049

    # Motor de rutas
    SOLVER_TIME_LIMIT_S: int = 30
    VELOCIDAD_KMH: float = 25.0  # velocidad urbana promedio
    VELOCIDAD_PUNTA_KMH: float = 15.0  # 7:00-9:00 y 17:00-20:00 (RN-011)
    FACTOR_VIAL: float = 1.3  # distancia por calles ≈ 1.3 × distancia en línea recta
    PESO_CO2: float = 1.0  # importancia de las emisiones frente a la distancia (Green VRP)
    SERVICIO_MIN: int = 10  # minutos de descarga por parada

    # Seguridad
    MAX_INTENTOS_LOGIN: int = 3
    BLOQUEO_LOGIN_MIN: int = 15

    # Compensación de carbono (RF-010)
    COSTO_TCO2_SOLES: float = 60.0
    CO2_ABSORBIDO_ARBOL_KG_ANIO: float = 22.0

    @field_validator("DATABASE_URL")
    @classmethod
    def _driver_psycopg(cls, url: str) -> str:
        # Render y otros PaaS entregan "postgres://" o "postgresql://"; SQLAlchemy necesita el driver psycopg 3
        for prefijo in ("postgres://", "postgresql://"):
            if url.startswith(prefijo):
                return "postgresql+psycopg://" + url.removeprefix(prefijo)
        return url

    @property
    def lista_cors(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
