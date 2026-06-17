#!/usr/bin/env bash
set -euo pipefail

PROJECT="/var/www/erlkim-ppob-digiflazz"
API="https://api.erlkim.web.id"
INV="${1:-BILL202606044B316B}"
TOKEN="$(cat /root/erlkim-admin-token-v24.txt 2>/dev/null || grep '^ADMIN_TOKEN=' "$PROJECT/.env" | cut -d= -f2- | tr -d '\r')"

echo "== v33 audit fixes test =="
echo "Invoice: $INV"

BODY="$(curl -sS --max-time 20 "$API/api/store/orders/$INV")"
echo "$BODY" | jq -e '.ok == true' >/dev/null

LEAK_PATTERNS='rawMidtransResponse|rawProviderResponse|signature_key|va_number|customer_no|customer_details|merchant_id|"full_name"'
if echo "$BODY" | grep -E "$LEAK_PATTERNS" >/dev/null; then
  echo "FAIL: public invoice leaks sensitive raw fields"
  echo "$BODY" | grep -E "$LEAK_PATTERNS" | head -20
  exit 1
fi

STATUS="$(echo "$BODY" | jq -r '.data.order.paymentStatus // empty')"
if [ "$STATUS" = "paid" ] || [ "$STATUS" = "expired" ] || [ "$STATUS" = "canceled" ] || [ "$STATUS" = "cancelled" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "refunded" ]; then
  if echo "$BODY" | grep -E 'midtransToken|midtransRedirectUrl' >/dev/null; then
    echo "FAIL: final public invoice exposes Midtrans token/redirect"
    exit 1
  fi
fi

echo "public invoice safe -> OK"

EVIL_HEADERS="$(curl -k -sS -I -X OPTIONS "$API/api/admin/auth/login" \
  -H 'Origin: https://evil.example.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  --max-time 10 || true)"
echo "$EVIL_HEADERS" | head -5
if echo "$EVIL_HEADERS" | grep -q 'HTTP/.* 500'; then
  echo "FAIL: disallowed CORS origin still returns 500"
  exit 1
fi

echo "CORS evil origin not 500 -> OK"

if [ -f "$PROJECT/.env" ]; then
  PERM="$(stat -c '%a' "$PROJECT/.env")"
  echo ".env perm -> $PERM"
  if [ "$PERM" != "600" ]; then
    echo "FAIL: .env permission should be 600"
    exit 1
  fi
fi

echo "V33 AUDIT FIXES OK"
