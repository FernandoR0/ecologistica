FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
# Dependencias con versión y hash bloqueados; solo paquetes binarios (sin ejecutar setup.py)
COPY requirements.lock .
RUN pip install --no-cache-dir --only-binary :all: --require-hashes -r requirements.lock
COPY app ./app
RUN useradd -m appuser
USER appuser
EXPOSE 8000
# Render asigna el puerto en $PORT; la carga demo es idempotente (no duplica datos)
CMD ["sh", "-c", "python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
