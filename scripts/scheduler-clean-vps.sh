#!/usr/bin/env bash
set -u

PROJECT="${PROJECT:-/var/www/erlkim-ppob-digiflazz}"
API_URL="${API_URL:-https://api.erlkim.web.id}"
INTERVAL_SECONDS="${SCHED_INTERVAL:-300}"
SMOKE_INTERVAL_SECONDS="${SMOKE_INTERVAL:-3600}"
LOG_FILE="${LOG_FILE:-$PROJECT/storage/logs/scheduler-clean.log}"
TOKEN_FILE="${TOKEN_FILE:-/root/erlkim-admin-token-v24.txt}"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" | tee -a "$LOG_FILE"
}

get_token() {
  if [ -s "$TOKEN_FILE" ]; then
    cat "$TOKEN_FILE" | tr -d '\r\n'
  elif [ -f "$PROJECT/.env" ]; then
    grep '^ADMIN_TOKEN=' "$PROJECT/.env" | tail -1 | cut -d= -f2- | tr -d '\r\n'
  else
    echo ""
  fi
}

curl_admin_get() {
  local path="$1"
  local token="$2"
  curl -k -sS --max-time 25 "$API_URL$path" -H "Authorization: Bearer $token"
}

curl_admin_post() {
  local path="$1"
  local token="$2"
  curl -k -sS --max-time 35 -X POST "$API_URL$path" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{}'
}

check_midtrans_pending() {
  local token="$1"
  local body invoices count invoice result ok payment order midstatus msg
  body="$(curl_admin_get "/api/admin/orders" "$token" 2>&1 || true)"

  if ! echo "$body" | jq -e '.ok == true and (.data|type == "array")' >/dev/null 2>&1; then
    log "WARN admin orders fetch failed: ${body:0:180}"
    return 0
  fi

  invoices="$(echo "$body" | jq -r '.data[]
    | select(.paymentMethod == "midtrans-snap")
    | select((.paymentStatus // "") != "paid")
    | select((.paymentStatus // "") != "expired")
    | select((.paymentStatus // "") != "canceled")
    | select((.paymentStatus // "") != "failed")
    | select((.orderStatus // "") != "success")
    | .invoice' | sort -u)"

  count="$(printf '%s\n' "$invoices" | sed '/^$/d' | wc -l | tr -d ' ')"
  log "midtrans pending candidates: $count"

  if [ "$count" = "0" ]; then
    return 0
  fi

  while IFS= read -r invoice; do
    [ -z "$invoice" ] && continue
    result="$(curl_admin_post "/api/admin/orders/$invoice/check-midtrans" "$token" 2>&1 || true)"
    ok="$(echo "$result" | jq -r '.ok // false' 2>/dev/null || echo false)"
    payment="$(echo "$result" | jq -r '.data.order.paymentStatus // empty' 2>/dev/null || true)"
    order="$(echo "$result" | jq -r '.data.order.orderStatus // empty' 2>/dev/null || true)"
    midstatus="$(echo "$result" | jq -r '.data.order.midtransStatus // empty' 2>/dev/null || true)"
    msg="$(echo "$result" | jq -r '.message // empty' 2>/dev/null || true)"
    log "check-midtrans invoice=$invoice ok=$ok payment=$payment order=$order midtrans=$midstatus msg=${msg:-'-'}"
    sleep 1
  done <<< "$invoices"
}

expire_pending() {
  local token="$1"
  local result code ok msg
  # Endpoint ini optional. Kalau build saat ini belum punya route, scheduler tidak crash.
  result="$(curl -k -sS --max-time 25 -w '\nHTTP_CODE:%{http_code}' -X POST "$API_URL/api/admin/maintenance/expire-pending" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{}' 2>&1 || true)"
  code="$(echo "$result" | awk -F: '/HTTP_CODE:/ {print $2}' | tail -1 | tr -d '\r')"
  result="$(echo "$result" | sed '/HTTP_CODE:/d')"
  if [ "$code" = "404" ]; then
    log "expire-pending skipped: endpoint not available"
    return 0
  fi
  ok="$(echo "$result" | jq -r '.ok // false' 2>/dev/null || echo false)"
  msg="$(echo "$result" | jq -r '.message // empty' 2>/dev/null || true)"
  log "expire-pending code=$code ok=$ok msg=${msg:-'-'} body=${result:0:160}"
}

run_smoke_if_due() {
  local state_file="$PROJECT/storage/logs/scheduler-clean-smoke-last"
  local now last diff
  now="$(date +%s)"
  last="0"
  [ -f "$state_file" ] && last="$(cat "$state_file" 2>/dev/null || echo 0)"
  diff=$((now-last))
  if [ "$diff" -lt "$SMOKE_INTERVAL_SECONDS" ]; then
    return 0
  fi
  echo "$now" > "$state_file"
  if [ -x "$PROJECT/scripts/smoke-vps.sh" ]; then
    log "running smoke-vps.sh"
    if bash "$PROJECT/scripts/smoke-vps.sh" >> "$LOG_FILE" 2>&1; then
      log "smoke OK"
    else
      log "WARN smoke failed"
    fi
  else
    log "smoke skipped: scripts/smoke-vps.sh not executable"
  fi
}

run_once() {
  local token
  token="$(get_token)"
  if [ -z "$token" ]; then
    log "ERROR admin token empty"
    return 1
  fi
  log "scheduler tick start api=$API_URL token_len=${#token}"
  check_midtrans_pending "$token"
  expire_pending "$token"
  run_smoke_if_due
  log "scheduler tick done"
}

if [ "${1:-}" = "--once" ]; then
  run_once
  exit $?
fi

log "scheduler clean started interval=${INTERVAL_SECONDS}s smoke_interval=${SMOKE_INTERVAL_SECONDS}s api=$API_URL"
while true; do
  run_once || true
  sleep "$INTERVAL_SECONDS"
done
