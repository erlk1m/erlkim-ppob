#!/usr/bin/env bash
set -u

PROJECT="/var/www/erlkim-ppob-digiflazz"
API="https://api.erlkim.web.id"
STORE="https://store.erlkim.web.id/"
ADMIN="https://admin.erlkim.web.id/"

TOKEN="$(cat /root/erlkim-admin-token-v24.txt 2>/dev/null || grep '^ADMIN_TOKEN=' "$PROJECT/.env" | cut -d= -f2- | tr -d '\r')"

echo "== ERLKIM VPS smoke =="
echo "API   : $API"
echo "Store : $STORE"
echo "Admin : $ADMIN"
echo "Token : ${#TOKEN} chars"
echo

check_http() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -k -sS --max-time 10 -o /dev/null -w "%{http_code}" "$url" || echo "000")"
  echo "$name -> HTTP $code"
  if [ "$code" != "200" ]; then
    echo "FAIL: $name"
    exit 1
  fi
}

check_json_ok() {
  local name="$1"
  local url="$2"
  local body
  body="$(curl -k -sS --max-time 15 "$url" || true)"
  echo "$name -> ${body:0:160}"
  echo "$body" | jq -e '.ok == true' >/dev/null || {
    echo "FAIL: $name"
    exit 1
  }
}

check_admin_json_ok() {
  local name="$1"
  local method="$2"
  local url="$3"
  local body

  if [ "$method" = "POST" ]; then
    body="$(curl -k -sS --max-time 20 -X POST "$url" -H "Authorization: Bearer $TOKEN" || true)"
  else
    body="$(curl -k -sS --max-time 20 "$url" -H "Authorization: Bearer $TOKEN" || true)"
  fi

  echo "$name -> ${body:0:200}"
  echo "$body" | jq -e '.ok == true' >/dev/null || {
    echo "FAIL: $name"
    exit 1
  }
}

check_http "api /health" "$API/health"
check_http "api /api/health" "$API/api/health"
check_http "store" "$STORE"
admin_code="$(curl -k -sS --max-time 10 -o /dev/null -w "%{http_code}" "$ADMIN" || echo "000")"
echo "admin -> HTTP $admin_code"
if [ "$admin_code" != "200" ] && [ "$admin_code" != "302" ]; then
  echo "FAIL: admin"
  exit 1
fi

check_json_ok "payment methods" "$API/api/payment-methods"

PRODUCTS_BODY="$(curl -k -sS --max-time 20 "$API/api/products?category=pulsa&audience=storefront&dedupe=true" || true)"
COUNT="$(echo "$PRODUCTS_BODY" | jq '.data | length' 2>/dev/null || echo 0)"
echo "products -> count=$COUNT"
if [ "$COUNT" -lt 1 ]; then
  echo "FAIL: products empty"
  exit 1
fi

check_admin_json_ok "midtrans status" "GET" "$API/api/admin/payments/midtrans/status"
check_admin_json_ok "digiflazz status" "GET" "$API/api/admin/providers/digiflazz/status"
echo "digiflazz balance -> optional check"
BALANCE_BODY="$(curl -k -sS --max-time 20 -X POST "$API/api/admin/providers/digiflazz/check-balance" -H "Authorization: Bearer $TOKEN" || true)"
echo "digiflazz balance -> ${BALANCE_BODY:0:220}"
if echo "$BALANCE_BODY" | jq -e '.ok == true' >/dev/null 2>&1; then
  echo "digiflazz balance -> OK"
else
  echo "WARN: digiflazz balance check failed/unsupported in current development mode, continuing smoke"
fi

echo
echo "SMOKE OK"
