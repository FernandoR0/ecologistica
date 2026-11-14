#!/usr/bin/env bash
# Levanta la API y el frontend cada vez que se inicia el Codespace
cd "$(dirname "$0")/.."
RAIZ="$(pwd)"

# setsid: los servidores quedan en su propia sesión y no se cierran cuando termina este script
if ! pgrep -f "uvicorn app.main:app" > /dev/null; then
  cd "$RAIZ/backend"
  setsid nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/api.log 2>&1 < /dev/null &
fi

# El frontend llama a /api y Vite lo reenvía a la API: así funciona con la URL pública del Codespace
if ! pgrep -f "vite" > /dev/null; then
  cd "$RAIZ/frontend"
  VITE_API_URL=/api setsid nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/web.log 2>&1 < /dev/null &
fi

echo "API: /tmp/api.log · Web: /tmp/web.log"
