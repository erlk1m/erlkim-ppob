#!/usr/bin/env bash
set -euo pipefail

cd /var/www/erlkim-ppob-digiflazz

ENTRY=""
for f in apps/web/src/main.tsx apps/web/src/main.ts apps/web/src/App.tsx apps/web/src/App.ts; do
  if [ -f "$f" ]; then
    ENTRY="$f"
    break
  fi
done

if [ -z "$ENTRY" ]; then
  echo "FAIL: web entry file not found"
  exit 1
fi

echo "== web UI import check =="
echo "ENTRY: $ENTRY"
echo

REQUIRED=(
  "v58-design-system.css"
  "v59-homepage-polish.css"
  "v60-product-grid-polish.css"
  "v61-checkout-ui-polish.css"
  "v62-invoice-ui-polish.css"
  "v63-mobile-polish.css"
)

for css in "${REQUIRED[@]}"; do
  COUNT="$(grep -c "$css" "$ENTRY" || true)"

  if [ "$COUNT" -eq 1 ]; then
    echo "OK: $css"
  elif [ "$COUNT" -eq 0 ]; then
    echo "FAIL: missing import $css"
    exit 1
  else
    echo "FAIL: duplicate import $css count=$COUNT"
    exit 1
  fi

  if [ ! -f "apps/web/src/styles/$css" ]; then
    echo "FAIL: missing file apps/web/src/styles/$css"
    exit 1
  fi
done

echo
echo "WEB UI IMPORT CHECK OK"
