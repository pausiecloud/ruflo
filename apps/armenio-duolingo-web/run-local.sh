#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

if [[ -z "${IP}" ]]; then
  IP="127.0.0.1"
fi

echo "Abre en este equipo: http://localhost:${PORT}"
echo "Abre en móvil (misma Wi‑Fi): http://${IP}:${PORT}"

cd "$(dirname "$0")"
python3 -m http.server "${PORT}"
