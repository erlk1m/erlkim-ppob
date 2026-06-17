import type { CategoryRule } from './types.js';

export const tvCategory: CategoryRule = {
  id: 'cat-tv',
  slug: 'tv',
  name: 'TV',
  description: 'Voucher dan paket TV berlangganan.',
  icon: '📺',
  type: 'prepaid',
  isActive: true,
  order: 120,
  match: {
    any: [/k-vision/i, /kvision/i, /nex\s*parabola/i, /parabola/i, /\btv\b/i, /televisi/i, /\bgol\b/i],
  },
  dedupeStrategy: 'brand-nominal',
};
