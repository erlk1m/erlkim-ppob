import type { CategoryRule } from './types';

export const emoneyCategory: CategoryRule = {
  id: 'cat-emoney',
  slug: 'emoney',
  name: 'E-Money',
  description: 'Top up dompet digital.',
  icon: '💳',
  type: 'prepaid',
  isActive: true,
  order: 40,
  match: {
    any: [/dana/i, /go\s*pay/i, /gopay/i, /ovo/i, /shopee\s*pay/i, /linkaja/i, /doku/i, /i\.saku/i, /isaku/i, /emoney/i, /e-money/i, /wallet/i],
  },
  dedupeStrategy: 'brand-nominal',
};
