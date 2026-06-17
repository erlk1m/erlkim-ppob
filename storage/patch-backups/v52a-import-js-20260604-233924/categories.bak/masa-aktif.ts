import type { CategoryRule } from './types';

export const masaAktifCategory: CategoryRule = {
  id: 'cat-masa-aktif',
  slug: 'masa-aktif',
  name: 'Masa Aktif',
  description: 'Tambah masa aktif kartu prabayar.',
  icon: '⏳',
  type: 'prepaid',
  isActive: true,
  order: 70,
  match: {
    any: [/masa\s*aktif/i, /tambah\s*masa\s*aktif/i, /\bmak\b/i],
  },
  dedupeStrategy: 'brand-nominal',
};
