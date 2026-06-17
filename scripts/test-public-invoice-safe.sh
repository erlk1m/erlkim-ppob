#!/usr/bin/env bash
set -euo pipefail
INVOICE="${1:-}"
API="${API:-https://api.erlkim.web.id}"
if [ -z "$INVOICE" ]; then
  echo "Usage: $0 INVOICE_ID" >&2
  echo "Example: $0 BILL202606044B316B" >&2
  exit 2
fi

body="$(curl -sS --max-time 20 "$API/api/store/orders/$INVOICE")"
echo "$body" | jq '{ok, invoice: .data.order.invoice, paymentStatus: .data.order.paymentStatus, orderStatus: .data.order.orderStatus, providerStatus: .data.order.providerStatus, sn: .data.order.sn, customerNoMasked: .data.order.customerNoMasked, customerName: .data.order.customerName}'

bad="$(echo "$body" | grep -E 'rawMidtransResponse|rawProviderResponse|signature_key|va_number|customer_no|full_name|merchant_id' || true)"
if [ -n "$bad" ]; then
  echo "FAIL: public response still contains sensitive keys:" >&2
  echo "$bad" >&2
  exit 1
fi

echo "PUBLIC INVOICE SAFE OK"
