#!/usr/bin/env bash
set -u
PROJECT="${PROJECT:-/var/www/my-ppob}"
API_URL="${API_URL:-https://api.example.com}"
TOKEN="$(cat /root/admin-admin-token-v24.txt 2>/dev/null || grep '^ADMIN_TOKEN=' "$PROJECT/.env" | cut -d= -f2- | tr -d '\r')"

echo "== scheduler status =="
pm2 describe ppob-scheduler 2>/dev/null | grep -E 'status|script path|exec cwd|restarts|uptime' || true
echo

echo "== last scheduler log =="
tail -80 "$PROJECT/storage/logs/scheduler-clean.log" 2>/dev/null || true
echo

echo "== pending midtrans candidates =="
curl -k -sS --max-time 20 "$API_URL/api/admin/orders" -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[] | select(.paymentMethod=="midtrans-snap") | select((.paymentStatus//"")!="paid") | select((.paymentStatus//"")!="expired") | select((.paymentStatus//"")!="canceled") | [.invoice,.paymentStatus,.orderStatus,.midtransStatus] | @tsv' 2>/dev/null || true
