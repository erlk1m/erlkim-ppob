import type { CategoryRule } from './types.js';

export const paketSmsTelponCategory: CategoryRule = {
  id: 'cat-paket-sms-telpon',
  slug: 'paket-sms-telpon',
  name: 'Paket SMS & Telpon',
  description: 'Paket SMS dan telepon semua operator.',
  icon: '☎️',
  type: 'prepaid',
  isActive: true,
  order: 60,
  match: {
    any: [/paket\s*sms/i, /\bsms\b/i, /telpon/i, /telepon/i, /nelpon/i, /voice/i],
  },
  dedupeStrategy: 'brand-nominal',
};
