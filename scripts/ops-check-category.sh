#!/usr/bin/env bash
set -euo pipefail

cd /var/www/erlkim-ppob-digiflazz

echo "== main smoke =="
bash scripts/smoke-vps.sh

echo
echo "== category smoke =="
bash scripts/smoke-category-vps.sh
