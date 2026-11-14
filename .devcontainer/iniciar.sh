#!/usr/bin/env bash
# Levanta la API y el frontend cada vez que se inicia el Codespace
cd "$(dirname "$0")/.."

(cd backend && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/api.log 2>&1 &)
# El frontend llama a /api y Vite lo reenvía a la API: así funciona con la URL pública del Codespace
(cd frontend && VITE_API_URL=/api nohup npm run dev -- --host 0.0.0.0 > /tmp/web.log 2>&1 &)

echo "API: /tmp/api.log · Web: /tmp/web.log"
