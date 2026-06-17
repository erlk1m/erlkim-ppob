export type ProductCategoryType = 'prepaid' | 'postpaid';

export type CategoryMatchInput = {
  sourceType?: string;
  category?: string;
  brand?: string;
  name?: string;
  buyerSkuCode?: string;
};

export type CategoryRule = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  type: ProductCategoryType;
  isActive: boolean;
  order: number;
  aliases?: string[];
  match: {
    category?: RegExp[];
    brand?: RegExp[];
    name?: RegExp[];
    sku?: RegExp[];
    any?: RegExp[];
  };
  dedupeStrategy?: 'brand-nominal' | 'sku' | 'none';
};

export function normalizeCategoryText(value: unknown) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function buildCombinedText(input: CategoryMatchInput) {
  return [
    input.sourceType,
    input.category,
    input.brand,
    input.name,
    input.buyerSkuCode,
  ].map(normalizeCategoryText).join(' ').replace(/\s+/g, ' ').trim();
}

export function matchesAny(value: string, patterns?: RegExp[]) {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((pattern) => pattern.test(value));
}

export function categoryToPublicMeta(category: CategoryRule) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    type: category.type,
    isActive: category.isActive,
  };
}
