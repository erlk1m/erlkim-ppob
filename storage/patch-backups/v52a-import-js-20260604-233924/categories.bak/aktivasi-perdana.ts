import type { CategoryRule } from './types';

export const aktivasiPerdanaCategory: CategoryRule = {
  id: 'cat-aktivasi-perdana',
  slug: 'aktivasi-perdana',
  name: 'Aktivasi Perdana',
  description: 'Paket aktivasi kartu perdana.',
  icon: '🆕',
  type: 'prepaid',
  isActive: true,
  order: 80,
  match: {
    any: [/aktivasi\s*perdana/i, /kartu\s*perdana/i, /\bperdana\b/i],
  },
  dedupeStrategy: 'brand-nominal',
};
