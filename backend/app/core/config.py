"""Configuración central leída de variables de entorno (.env)."""

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
    FACTOR_VIAL: float = 1.3  # distancia por calles ≈ 1.3 × distancia en línea recta
    PESO_CO2: float = 1.0  # importancia de las emisiones frente a la distancia (Green VRP)
    SERVICIO_MIN: int = 10  # minutos de descarga por parada

    # Seguridad
    MAX_INTENTOS_LOGIN: int = 5
    BLOQUEO_LOGIN_MIN: int = 15

    # Compensación de carbono (RF-010)
    COSTO_TCO2_SOLES: float = 60.0
    CO2_ABSORBIDO_ARBOL_KG_ANIO: float = 22.0

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
