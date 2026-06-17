import type { CategoryRule } from './types.js';

export const aktivasiVoucherCategory: CategoryRule = {
  id: 'cat-aktivasi-voucher',
  slug: 'aktivasi-voucher',
  name: 'Aktivasi Voucher',
  description: 'Aktivasi dan cek status voucher.',
  icon: '🎟️',
  type: 'prepaid',
  isActive: true,
  order: 90,
  match: {
    any: [/aktivasi\s*voucher/i, /cek\s*status\s*voucher/i, /status\s*voucher/i],
  },
  dedupeStrategy: 'brand-nominal',
};
