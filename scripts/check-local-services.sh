#!/usr/bin/env bash
set -euo pipefail

echo "== PM2 =="
pm2 list || true

echo "== Local API =="
curl -i --max-time 10 http://127.0.0.1:3001/health || curl -i --max-time 10 http://127.0.0.1:3001/api/health || true

echo "== Local Store =="
curl -I --max-time 10 http://127.0.0.1:3000/ || true

echo "== Local Admin =="
curl -I --max-time 10 http://127.0.0.1:3333/ || true

echo "== Cloudflared =="
systemctl status cloudflared --no-pager || true
journalctl -u cloudflared -n 80 --no-pager || true
