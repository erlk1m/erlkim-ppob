import type { CategoryRule } from './types';

export const esimCategory: CategoryRule = {
  id: 'cat-esim',
  slug: 'esim',
  name: 'eSIM',
  description: 'Produk dan paket eSIM.',
  icon: '📶',
  type: 'prepaid',
  isActive: true,
  order: 100,
  match: {
    any: [/\besim\b/i, /e-sim/i],
  },
  dedupeStrategy: 'brand-nominal',
};
