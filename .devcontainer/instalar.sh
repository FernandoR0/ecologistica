#!/usr/bin/env bash
# Instala dependencias y carga los datos de demostración (se ejecuta una sola vez al crear el Codespace)
set -e
cd "$(dirname "$0")/.."

python -m pip install --only-binary :all: --require-hashes -r backend/requirements.lock

if [[ ! -f backend/.env ]]; then
  {
    echo "DATABASE_URL=sqlite:///./ecologistica.db"
    echo "JWT_SECRET=$(openssl rand -hex 32)"
    echo "SOLVER_TIME_LIMIT_S=10"
  } > backend/.env
fi
(cd backend && python -m app.seed)

(cd frontend && npm ci --ignore-scripts)
