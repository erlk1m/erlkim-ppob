import type { CategoryRule } from './types.js';

export const streamingCategory: CategoryRule = {
  id: 'cat-streaming',
  slug: 'streaming',
  name: 'Streaming',
  description: 'Voucher dan paket streaming.',
  icon: '▶️',
  type: 'prepaid',
  isActive: true,
  order: 110,
  match: {
    any: [/vidio/i, /netflix/i, /viu/i, /spotify/i, /youtube/i, /streaming/i],
  },
  dedupeStrategy: 'brand-nominal',
};
