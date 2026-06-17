import type { CategoryRule } from './types.js';

export const tagihanCategory: CategoryRule = {
  id: 'cat-tagihan',
  slug: 'tagihan',
  name: 'Tagihan',
  description: 'PLN, PDAM, BPJS, internet, pascabayar.',
  icon: '🧾',
  type: 'postpaid',
  isActive: true,
  order: 999,
  match: {
    any: [/tagihan/i, /postpaid/i, /pascabayar/i, /bpjs/i, /pdam/i],
  },
  dedupeStrategy: 'sku',
};
