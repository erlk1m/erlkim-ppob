#!/usr/bin/env bash
set -euo pipefail

INVOICE="${1:-BILL202606044B316B}"
API="${API:-https://api.erlkim.web.id}"

echo "== public paid token cleanup test =="
echo "Invoice: $INVOICE"

BODY="$(curl -sS --max-time 20 "$API/api/store/orders/$INVOICE")"

echo "$BODY" | jq -e '.ok == true' >/dev/null
PAYMENT_STATUS="$(echo "$BODY" | jq -r '.data.order.paymentStatus // empty')"
ORDER_STATUS="$(echo "$BODY" | jq -r '.data.order.orderStatus // empty')"
echo "paymentStatus=$PAYMENT_STATUS orderStatus=$ORDER_STATUS"

if echo "$BODY" | jq -e '.data.order.midtransToken? // empty' >/dev/null; then
  echo "FAIL: public paid/final invoice still exposes order.midtransToken"
  exit 1
fi
if echo "$BODY" | jq -e '.data.order.midtransRedirectUrl? // empty' >/dev/null; then
  echo "FAIL: public paid/final invoice still exposes order.midtransRedirectUrl"
  exit 1
fi
if echo "$BODY" | grep -Eq 'rawMidtransResponse|rawProviderResponse|signature_key|va_number|customer_no'; then
  echo "FAIL: public invoice still exposes raw/sensitive fields"
  exit 1
fi

echo "PUBLIC PAID TOKEN CLEANUP OK"
