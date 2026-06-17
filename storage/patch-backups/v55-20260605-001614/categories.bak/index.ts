import type { CategoryMatchInput, CategoryRule } from './types.js';
import { buildCombinedText, categoryToPublicMeta, matchesAny } from './types.js';

import { pulsaCategory } from './pulsa.js';
import { paketDataCategory } from './paket-data.js';
import { tokenPlnCategory } from './token-pln.js';
import { emoneyCategory } from './emoney.js';
import { gameCategory } from './game.js';
import { paketSmsTelponCategory } from './paket-sms-telpon.js';
import { masaAktifCategory } from './masa-aktif.js';
import { aktivasiPerdanaCategory } from './aktivasi-perdana.js';
import { aktivasiVoucherCategory } from './aktivasi-voucher.js';
import { esimCategory } from './esim.js';
import { streamingCategory } from './streaming.js';
import { tvCategory } from './tv.js';
import { tagihanCategory } from './tagihan.js';

export const PRODUCT_CATEGORIES: CategoryRule[] = [
  tokenPlnCategory,
  masaAktifCategory,
  aktivasiVoucherCategory,
  aktivasiPerdanaCategory,
  paketSmsTelponCategory,
  esimCategory,
  tvCategory,
  streamingCategory,
  gameCategory,
  emoneyCategory,
  paketDataCategory,
  pulsaCategory,
  tagihanCategory,
];

export const STOREFRONT_CATEGORIES = PRODUCT_CATEGORIES
  .filter((category) => category.isActive)
  .slice()
  .sort((a, b) => a.order - b.order);

export const STOREFRONT_CATEGORY_SLUGS = new Set(
  STOREFRONT_CATEGORIES.flatMap((category) => [category.slug, ...(category.aliases || [])])
);

export function getCategoryBySlug(slug: string) {
  return PRODUCT_CATEGORIES.find((category) => category.slug === slug || category.aliases?.includes(slug));
}

export function getPublicCategories() {
  return STOREFRONT_CATEGORIES.map(categoryToPublicMeta);
}

export function mapProductCategory(input: CategoryMatchInput) {
  const sourceType = String(input.sourceType || '').toLowerCase();
  if (sourceType === 'postpaid') return tagihanCategory.slug;

  const combined = buildCombinedText(input);

  for (const category of PRODUCT_CATEGORIES) {
    if (category.slug === 'pulsa' || category.slug === 'tagihan') continue;
    if (matchesAny(combined, category.match.any)) return category.slug;
  }

  return pulsaCategory.slug;
}
