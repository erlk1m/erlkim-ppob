import type { CategoryRule } from './types.js';

export const pulsaCategory: CategoryRule = {
  id: 'cat-pulsa',
  slug: 'pulsa',
  name: 'Pulsa',
  description: 'Top up pulsa semua operator.',
  icon: '📱',
  type: 'prepaid',
  isActive: true,
  order: 10,
  match: {
    any: [/pulsa/i, /regular/i],
  },
  dedupeStrategy: 'brand-nominal',
};
