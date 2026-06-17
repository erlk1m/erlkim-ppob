#!/usr/bin/env bash
set -u

PROJECT="/var/www/erlkim-ppob-digiflazz"
API="https://api.erlkim.web.id"
STORE="https://store.erlkim.web.id"
ADMIN="https://admin.erlkim.web.id"
TOKEN="$(cat /root/erlkim-admin-token-v24.txt 2>/dev/null || grep '^ADMIN_TOKEN=' "$PROJECT/.env" | cut -d= -f2- | tr -d '\r')"

pass(){ echo "✅ $1"; }
warn(){ echo "⚠️  $1"; }
fail(){ echo "❌ $1"; }

echo "== ERLKIM PPOB SECURITY + BUG AUDIT =="
echo "time: $(date)"
echo

echo "== 1. PM2 =="
pm2 list
echo

echo "== 2. Public health =="
for url in "$API/health" "$API/api/health" "$STORE/" "$ADMIN/"; do
  code="$(curl -k -sS --max-time 10 -o /dev/null -w "%{http_code}" "$url" || echo 000)"
  echo "$url -> $code"
done
echo

echo "== 3. Public API data =="
curl -sS --max-time 15 "$API/api/payment-methods" | jq '{ok, count:(.data|length), methods:[.data[].id]}' || fail "payment-methods invalid JSON"

PRODUCTS="$(curl -sS --max-time 20 "$API/api/products?category=pulsa&audience=storefront&dedupe=true" || true)"
echo "$PRODUCTS" | jq '{ok, count:(.data|length), first:.data[0].name}' || fail "products invalid JSON"
echo

echo "== 4. Admin API protection =="
NOAUTH="$(curl -sS --max-time 15 "$API/api/admin/payments/midtrans/status" || true)"
echo "no auth midtrans status -> ${NOAUTH:0:120}"
echo "$NOAUTH" | jq -e '.ok == false' >/dev/null && pass "admin API rejects no-token" || warn "admin API no-token check unusual"

AUTH="$(curl -sS --max-time 15 "$API/api/admin/payments/midtrans/status" -H "Authorization: Bearer $TOKEN" || true)"
echo "auth midtrans status -> ${AUTH:0:160}"
echo "$AUTH" | jq -e '.ok == true and .data.configured == true' >/dev/null && pass "admin API token works" || fail "admin token/admin midtrans status failed"
echo

echo "== 5. Digiflazz =="
DSTAT="$(curl -sS --max-time 15 "$API/api/admin/providers/digiflazz/status" -H "Authorization: Bearer $TOKEN" || true)"
echo "digiflazz status -> ${DSTAT:0:200}"
echo "$DSTAT" | jq -e '.ok == true and .data.configured == true' >/dev/null && pass "digiflazz configured" || fail "digiflazz status failed"

DBAL="$(curl -sS --max-time 20 -X POST "$API/api/admin/providers/digiflazz/check-balance" -H "Authorization: Bearer $TOKEN" || true)"
echo "digiflazz balance -> ${DBAL:0:200}"
echo "$DBAL" | jq -e '.ok == true' >/dev/null && pass "digiflazz balance/check ok" || warn "digiflazz balance failed"
echo

echo "== 6. Midtrans webhook alias security =="
EMPTY_WEBHOOK="$(curl -sS --max-time 15 -X POST "$API/api/payment-provider/callback/midtrans" -H "Content-Type: application/json" -d '{}' || true)"
echo "empty webhook -> ${EMPTY_WEBHOOK:0:160}"
echo "$EMPTY_WEBHOOK" | jq -e '.ok == false' >/dev/null && pass "empty/invalid webhook rejected" || warn "webhook empty payload behavior unusual"
echo

echo "== 7. Public invoice leak check =="
INV="${1:-BILL202606044B316B}"
BODY="$(curl -sS --max-time 20 "$API/api/store/orders/$INV" || true)"
echo "$BODY" | jq -e '.ok == true' >/dev/null && pass "public invoice reachable: $INV" || warn "public invoice not found: $INV"

LEAK_PATTERNS='rawMidtransResponse|rawProviderResponse|signature_key|va_number|customer_no|customer_details|merchant_id|"full_name"'
if echo "$BODY" | grep -E "$LEAK_PATTERNS" >/dev/null; then
  fail "public invoice still leaks sensitive raw fields"
  echo "$BODY" | grep -E "$LEAK_PATTERNS" | head -20
else
  pass "public invoice raw sensitive fields hidden"
fi

PAID_TOKEN_PATTERNS='midtransToken|midtransRedirectUrl'
STATUS="$(echo "$BODY" | jq -r '.data.order.paymentStatus // empty' 2>/dev/null)"
if [ "$STATUS" = "paid" ] || [ "$STATUS" = "expired" ] || [ "$STATUS" = "canceled" ] || [ "$STATUS" = "failed" ]; then
  if echo "$BODY" | grep -E "$PAID_TOKEN_PATTERNS" >/dev/null; then
    fail "paid/final public invoice still exposes Midtrans token/redirect"
  else
    pass "paid/final public invoice hides Midtrans token/redirect"
  fi
else
  warn "invoice $INV status=$STATUS, token may be intentionally visible if unpaid"
fi
echo

echo "== 8. CORS =="
for origin in "https://store.erlkim.web.id" "https://admin.erlkim.web.id" "https://evil.example.com"; do
  echo "-- Origin: $origin"
  curl -k -sS -I -X OPTIONS "$API/api/admin/auth/login" \
    -H "Origin: $origin" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type" \
    --max-time 10 | grep -iE 'HTTP/|access-control-allow-origin|access-control-allow-credentials' || true
done
echo

echo "== 9. Local file secret hygiene =="
echo ".env permissions:"
ls -l "$PROJECT/.env" 2>/dev/null || true
echo "root token files:"
ls -l /root/erlkim-admin-token-v24.txt /root/erlkim-rotated-secrets-*.txt 2>/dev/null | tail -10 || true

echo "search obvious secrets in public/build files:"
grep -RInE 'Mid-server-|Mid-client-|DIGIFLAZZ_API_KEY|ADMIN_TOKEN|ADMIN_PASSWORD|dev-[a-f0-9-]{20,}' \
  "$PROJECT/apps/web/dist" "$PROJECT/apps/admin/dist" "$PROJECT/public" 2>/dev/null | head -30 || true
echo

echo "== 10. Route sanity =="
grep -RIn "payment-provider/callback/midtrans\|payment/midtrans/webhook\|api/store/orders/:invoice\|api/admin/orders" \
  "$PROJECT/apps/api/src/index.ts" "$PROJECT/apps/api/dist/index.js" 2>/dev/null || true
echo

echo "== AUDIT DONE =="
