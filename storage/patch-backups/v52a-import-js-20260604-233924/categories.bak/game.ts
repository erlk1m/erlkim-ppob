import type { CategoryRule } from './types';

export const gameCategory: CategoryRule = {
  id: 'cat-game',
  slug: 'game',
  name: 'Game',
  description: 'Top up game dan voucher digital.',
  icon: '🎮',
  type: 'prepaid',
  isActive: true,
  order: 50,
  aliases: ['voucher-game'],
  match: {
    any: [/mobile\s*legends/i, /mobilelegend/i, /free\s*fire/i, /diamond/i, /google\s*play/i, /playstation/i, /psn/i, /voucher\s*game/i, /\bgame\b/i],
  },
  dedupeStrategy: 'brand-nominal',
};
