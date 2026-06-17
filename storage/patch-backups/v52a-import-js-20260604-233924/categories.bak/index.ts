import type { CategoryMatchInput, CategoryRule } from './types';
import { buildCombinedText, categoryToPublicMeta, matchesAny } from './types';

import { pulsaCategory } from './pulsa';
import { paketDataCategory } from './paket-data';
import { tokenPlnCategory } from './token-pln';
import { emoneyCategory } from './emoney';
import { gameCategory } from './game';
import { paketSmsTelponCategory } from './paket-sms-telpon';
import { masaAktifCategory } from './masa-aktif';
import { aktivasiPerdanaCategory } from './aktivasi-perdana';
import { aktivasiVoucherCategory } from './aktivasi-voucher';
import { esimCategory } from './esim';
import { streamingCategory } from './streaming';
import { tvCategory } from './tv';
import { tagihanCategory } from './tagihan';

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
