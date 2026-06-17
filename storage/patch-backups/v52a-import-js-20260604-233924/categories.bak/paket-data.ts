import type { CategoryRule } from './types';

export const paketDataCategory: CategoryRule = {
  id: 'cat-paket-data',
  slug: 'paket-data',
  name: 'Paket Data',
  description: 'Kuota internet harian dan bulanan.',
  icon: '🌐',
  type: 'prepaid',
  isActive: true,
  order: 20,
  match: {
    any: [/data/i, /internet/i, /kuota/i, /freedom/i, /xtra/i, /aigo/i, /flash/i, /happy/i, /bronnet/i, /bronet/i, /edukasi/i, /ilmupedia/i, /ketengan/i, /\bgb\b/i, /\bmb\b/i],
  },
  dedupeStrategy: 'brand-nominal',
};
