#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
cd "$(dirname "$0")"

echo "Iniciando servidor local en http://localhost:${PORT} ..."
python3 -m http.server "${PORT}" --bind 0.0.0.0 >/tmp/armenio-public-http.log 2>&1 &
HTTP_PID=$!

cleanup() {
  kill "${HTTP_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "Creando túnel público (localhost.run)..."
echo "Cuando veas una URL https://xxxx.lhr.life, pégala en Safari del iPhone."

ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:"${PORT}" nokey@localhost.run
