import type { CategoryRule } from './types';

export const tokenPlnCategory: CategoryRule = {
  id: 'cat-token-pln',
  slug: 'token-pln',
  name: 'Token PLN',
  description: 'Token listrik prabayar.',
  icon: '⚡',
  type: 'prepaid',
  isActive: true,
  order: 30,
  match: {
    any: [/^pln/i, /\bpln\b/i, /token/i, /listrik/i],
  },
  dedupeStrategy: 'brand-nominal',
};
