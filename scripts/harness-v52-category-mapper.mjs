#!/usr/bin/env node
import fs from 'node:fs';

const API_BASE = process.env.API_BASE || 'https://api.erlkim.web.id/api';
const TOKEN =
  process.env.ADMIN_TOKEN ||
  (fs.existsSync('/root/erlkim-admin-token-v24.txt')
    ? fs.readFileSync('/root/erlkim-admin-token-v24.txt', 'utf8').trim()
    : '');

if (!TOKEN) {
  console.error('ERROR: ADMIN_TOKEN kosong. Set ADMIN_TOKEN atau pastikan /root/erlkim-admin-token-v24.txt ada.');
  process.exit(1);
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function pickProductArray(json) {
  const arr = json?.data?.items || json?.data?.products || json?.data || [];
  return Array.isArray(arr) ? arr : [];
}

function productInput(product) {
  return {
    currentCategory: product.categorySlug || product.category || '',
    sourceType: product.type || product.sourceType || '',
    category: product.category || '',
    brand: product.brand || '',
    name: product.name || product.productName || product.product_name || '',
    code: product.providerCode || product.buyerSkuCode || product.buyer_sku_code || product.sku || '',
  };
}

function mapProposed(product) {
  const input = productInput(product);
  const sourceType = norm(input.sourceType);
  const text = norm(`${input.category} ${input.brand} ${input.name} ${input.code}`);

  if (sourceType === 'postpaid') return 'tagihan';

  if (/^pln|\bpln\b|token|listrik/.test(text)) return 'token-pln';

  // Specific categories first.
  if (/masa\s*aktif|tambah\s*masa\s*aktif|\bmak\b/.test(text)) return 'masa-aktif';
  if (/aktivasi\s*voucher|cek\s*status\s*voucher|status\s*voucher/.test(text)) return 'aktivasi-voucher';
  if (/aktivasi\s*perdana|kartu\s*perdana|\bperdana\b/.test(text)) return 'aktivasi-perdana';
  if (/paket\s*sms|\bsms\b|telpon|telepon|nelpon|voice/.test(text)) return 'paket-sms-telpon';
  if (/\besim\b|e-sim/.test(text)) return 'esim';
  if (/vidio|netflix|viu|spotify|youtube|streaming/.test(text)) return 'streaming';
  if (/k-vision|kvision|nex\s*parabola|parabola|\btv\b|televisi|\bgol\b/.test(text)) return 'tv';
  if (/mobile\s*legends|mobilelegend|free\s*fire|diamond|google\s*play|playstation|psn|voucher\s*game|\bgame\b/.test(text)) return 'game';

  // Existing broad categories.
  if (/dana|go\s*pay|gopay|ovo|shopee\s*pay|linkaja|doku|i\.saku|isaku|emoney|e-money|wallet/.test(text)) return 'emoney';
  if (/data|internet|kuota|freedom|xtra|aigo|flash|happy|bronnet|bronet|edukasi|ilmupedia|ketengan|gb\b|mb\b/.test(text)) return 'paket-data';

  return 'pulsa';
}

async function main() {
  const res = await fetch(`${API_BASE}/admin/products?limit=1000`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error('ERROR: response bukan JSON');
    console.error(text.slice(0, 500));
    process.exit(1);
  }

  const products = pickProductArray(json);

  const currentCounts = {};
  const proposedCounts = {};
  const changes = [];
  const samplesByProposed = {};

  for (const product of products) {
    const input = productInput(product);
    const current = input.currentCategory || 'NO_CATEGORY';
    const proposed = mapProposed(product);

    currentCounts[current] = (currentCounts[current] || 0) + 1;
    proposedCounts[proposed] = (proposedCounts[proposed] || 0) + 1;

    if (!samplesByProposed[proposed]) samplesByProposed[proposed] = [];
    if (samplesByProposed[proposed].length < 8) {
      samplesByProposed[proposed].push({
        name: input.name,
        code: input.code,
        brand: input.brand,
        currentCategory: current,
        proposedCategory: proposed,
      });
    }

    if (current !== proposed) {
      changes.push({
        name: input.name,
        code: input.code,
        brand: input.brand,
        from: current,
        to: proposed,
      });
    }
  }

  console.log('== TOTAL PRODUCTS ==');
  console.log(products.length);

  console.log('\n== CURRENT CATEGORY COUNTS ==');
  console.log(JSON.stringify(currentCounts, null, 2));

  console.log('\n== PROPOSED CATEGORY COUNTS ==');
  console.log(JSON.stringify(proposedCounts, null, 2));

  console.log('\n== CHANGES COUNT ==');
  console.log(changes.length);

  console.log('\n== CHANGES BY TARGET CATEGORY ==');
  const changesByTarget = {};
  for (const change of changes) {
    changesByTarget[change.to] = (changesByTarget[change.to] || 0) + 1;
  }
  console.log(JSON.stringify(changesByTarget, null, 2));

  console.log('\n== CHANGE SAMPLES, FIRST 80 ==');
  console.log(JSON.stringify(changes.slice(0, 80), null, 2));

  console.log('\n== SAMPLES BY PROPOSED CATEGORY ==');
  console.log(JSON.stringify(samplesByProposed, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
