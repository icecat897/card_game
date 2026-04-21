import type { Enhancement } from './Enhancement'

export interface ScrollDef {
  id: string
  name: string
  description: string
  enhancement: Enhancement
  price: number
  rarity: 1 | 2 | 3
  glyph: string
  color: number
}

export const SCROLLS: Record<string, ScrollDef> = {
  silk_scroll: {
    id: 'silk_scroll',
    name: 'Silk Weave',
    description: 'Turn any face-up card into a Silk card (+30 Chips).',
    enhancement: 'silk',
    price: 3,
    rarity: 1,
    glyph: '\u2756',
    color: 0x4a9eff
  },
  venom_scroll: {
    id: 'venom_scroll',
    name: 'Venom Sac',
    description: 'Turn any face-up card into a Venom card (+5 Mult).',
    enhancement: 'venom',
    price: 3,
    rarity: 1,
    glyph: '\u26a1',
    color: 0xff5a5f
  },
  gilding_scroll: {
    id: 'gilding_scroll',
    name: 'Gilded Thread',
    description: 'Turn any face-up card into a Gilded card (+0.15 X-Mult on clear).',
    enhancement: 'gilded',
    price: 5,
    rarity: 2,
    glyph: '\u2726',
    color: 0xffd67a
  },
  brittle_scroll: {
    id: 'brittle_scroll',
    name: 'Brittle Cocoon',
    description: 'Turn any face-up card into a Brittle card (x1.8 Mult when cleared).',
    enhancement: 'brittle',
    price: 4,
    rarity: 2,
    glyph: '\u2747',
    color: 0xa8e0ff
  },
  dewdrop_scroll: {
    id: 'dewdrop_scroll',
    name: 'Morning Dew',
    description: 'Turn any face-up card into a Dewdrop card (+$4 when flipped).',
    enhancement: 'dewdrop',
    price: 3,
    rarity: 1,
    glyph: '\u2756',
    color: 0xffe08a
  },
  petrify_scroll: {
    id: 'petrify_scroll',
    name: 'Petrify',
    description: 'Turn any face-up card into a Petrified card (any rank connects).',
    enhancement: 'petrified',
    price: 5,
    rarity: 2,
    glyph: '\u25C6',
    color: 0x8a8880
  }
}
