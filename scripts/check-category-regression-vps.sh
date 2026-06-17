#!/usr/bin/env bash
set -euo pipefail

API="${API:-https://api.erlkim.web.id/api}"
TOKEN="${ADMIN_TOKEN:-$(cat /root/erlkim-admin-token-v24.txt 2>/dev/null || true)}"

echo "== ERLKIM category regression =="
echo "API: $API"
echo

EXPECTED_CATEGORIES=(
  pulsa
  paket-data
  token-pln
  emoney
  game
  paket-sms-telpon
  masa-aktif
  aktivasi-perdana
  aktivasi-voucher
  esim
  streaming
  tv
  tagihan
)

EXPECTED_PRODUCT_NONZERO=(
  game
  paket-sms-telpon
  masa-aktif
  aktivasi-perdana
  aktivasi-voucher
  esim
  streaming
  tv
)

echo "== public categories =="
CATEGORIES_JSON="$(curl -fsS "$API/categories?audience=storefront")"

echo "$CATEGORIES_JSON" | node -e '
let d="";
process.stdin.on("data",c=>d+=c).on("end",()=>{
  const j=JSON.parse(d);
  const arr=j.data||[];
  console.log(arr.map(x=>`${x.slug}: ${x.name}`).join("\n"));
});
'

echo
echo "== category presence check =="
for c in "${EXPECTED_CATEGORIES[@]}"; do
  if echo "$CATEGORIES_JSON" | node -e "let d='';process.stdin.on('data',x=>d+=x).on('end',()=>{const j=JSON.parse(d);const ok=(j.data||[]).some(x=>x.slug === '$c'); process.exit(ok?0:1);})"; then
    echo "OK: $c"
  else
    echo "FAIL: missing category $c"
    exit 1
  fi
done

echo
echo "== storefront product count check =="
for c in "${EXPECTED_PRODUCT_NONZERO[@]}"; do
  COUNT="$(
    curl -fsS "$API/products?audience=storefront&category=$c&dedupe=true" \
      | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);const arr=j.data?.items||j.data?.products||j.data||[]; console.log(Array.isArray(arr)?arr.length:0);})'
  )"

  echo "$c: $COUNT"

  if [ "$COUNT" -le 0 ]; then
    echo "FAIL: product count is zero for $c"
    exit 1
  fi
done

echo
echo "== admin category distribution =="
if [ -z "$TOKEN" ]; then
  echo "WARN: ADMIN_TOKEN empty, skip admin products distribution"
else
  ADMIN_JSON="$(curl -fsS "$API/admin/products?limit=1000" -H "Authorization: Bearer $TOKEN")"

  echo "$ADMIN_JSON" | node -e '
let d="";
process.stdin.on("data",c=>d+=c).on("end",()=>{
  const j=JSON.parse(d);
  let arr=j.data?.items||j.data?.products||j.data||[];
  arr=Array.isArray(arr)?arr:[];
  const cats={};
  for (const x of arr) {
    const k=x.categorySlug||x.category||"NO_CATEGORY";
    cats[k]=(cats[k]||0)+1;
  }
  console.log(JSON.stringify(cats,null,2));

  const required = [
    "tagihan",
    "paket-data",
    "pulsa",
    "masa-aktif",
    "aktivasi-perdana",
    "tv",
    "aktivasi-voucher",
    "emoney",
    "game",
    "paket-sms-telpon",
    "esim",
    "token-pln",
    "streaming"
  ];

  for (const key of required) {
    if (!cats[key] || cats[key] <= 0) {
      console.error(`FAIL: admin distribution missing ${key}`);
      process.exit(1);
    }
  }
});
'
fi

echo
echo "CATEGORY REGRESSION OK"
