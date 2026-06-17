#!/usr/bin/env bash
set -euo pipefail

echo "== Public API HTTPS =="
curl -i --max-time 20 https://api.erlkim.web.id/health || curl -i --max-time 20 https://api.erlkim.web.id/api/health || true

echo "== Public Store HTTP =="
curl -I --max-time 20 http://store.erlkim.web.id/ || true

echo "== Public Store HTTPS =="
curl -I --max-time 20 https://store.erlkim.web.id/ || true

echo "== Public Admin HTTPS =="
curl -I --max-time 20 https://admin.erlkim.web.id/ || true
