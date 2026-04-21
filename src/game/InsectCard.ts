export interface InsectCardDef {
  id: string
  name: string
  description: string
  rarity: 1 | 2 | 3 | 4 | 5
  price: number
  glyph: string
  color: number

  /** per move */
  onMoveMultBonus?: number
  onMoveChipsBonus?: number
  onFlipMultAccum?: number
  onFlipXMultAdd?: number

  /** on clear */
  onClearXMultAdd?: number
  onClearStepRefund?: number
  clearChipsMult?: number
  clearCoinBonus?: number

  /** rule/global */
  emptyColumnMultOverride?: number
  redCardChipsBonus?: number
  allowCrossColorStack?: boolean

  /** conditional */
  lowRankMultMult?: number       // moving A or 2 -> mult * N
  noEmptyColumnXMult?: number    // if no empty column ever this round -> xmult * N
  firstClearXMultBonus?: number  // only first clear this round
  perInsectMultBonus?: number    // per held insect count
  scrollUseMultAccum?: number    // per scroll used this round
  potionUseChipsBonus?: number   // per potion used this round
}

export const INSECT_CARDS: Record<string, InsectCardDef> = {
  firefly: {
    id: 'firefly',
    name: 'Firefly',
    description: 'Each move grants +1 Mult.',
    rarity: 1,
    price: 3,
    glyph: 'F',
    color: 0xffe87a,
    onMoveMultBonus: 1
  },
  scarab: {
    id: 'scarab',
    name: 'Scarab Beetle',
    description: 'Moving a red card grants +20 Chips per card.',
    rarity: 1,
    price: 3,
    glyph: 'S',
    color: 0xd98460,
    redCardChipsBonus: 20
  },
  mosquito: {
    id: 'mosquito',
    name: 'Mosquito',
    description: 'Each clear grants +$3.',
    rarity: 1,
    price: 3,
    glyph: 'Q',
    color: 0x9a7a8f,
    clearCoinBonus: 3
  },
  ladybug: {
    id: 'ladybug',
    name: 'Ladybug',
    description: 'Each move grants +10 Chips.',
    rarity: 2,
    price: 5,
    glyph: 'L',
    color: 0xff7a5a,
    onMoveChipsBonus: 10
  },
  weaver_spider: {
    id: 'weaver_spider',
    name: 'Weaver Spider',
    description: '+2 Mult per card flipped (stacks this round).',
    rarity: 2,
    price: 4,
    glyph: 'W',
    color: 0x9a7fbf,
    onFlipMultAccum: 2
  },
  mantis: {
    id: 'mantis',
    name: 'Mantis',
    description: 'Moving an A or 2 grants x3 Mult on that move.',
    rarity: 2,
    price: 6,
    glyph: 'M',
    color: 0x5a7a3a,
    lowRankMultMult: 3
  },
  queen_bee: {
    id: 'queen_bee',
    name: 'Queen Bee',
    description: 'Each empty column grants +4 Mult (was +1).',
    rarity: 3,
    price: 7,
    glyph: 'B',
    color: 0xffb347,
    emptyColumnMultOverride: 4
  },
  cicada_shell: {
    id: 'cicada_shell',
    name: 'Cicada Shell',
    description: 'Refund +3 steps on every clear.',
    rarity: 3,
    price: 7,
    glyph: 'C',
    color: 0x7fdcb1,
    onClearStepRefund: 3
  },
  parasitic_wasp: {
    id: 'parasitic_wasp',
    name: 'Parasitic Wasp',
    description: '+0.08 X-Mult every clear.',
    rarity: 3,
    price: 6,
    glyph: 'P',
    color: 0xc86aa0,
    onClearXMultAdd: 0.08
  },
  dragonfly: {
    id: 'dragonfly',
    name: 'Dragonfly',
    description: '+3 Mult per scroll used this round (stacks).',
    rarity: 3,
    price: 7,
    glyph: 'D',
    color: 0x66aaff,
    scrollUseMultAccum: 3
  },
  rove_beetle: {
    id: 'rove_beetle',
    name: 'Rove Beetle',
    description: 'Sequences may be placed on any rank+1 card regardless of suit restriction.',
    rarity: 3,
    price: 8,
    glyph: 'R',
    color: 0x7a9e55,
    allowCrossColorStack: true
  },
  spider_mother: {
    id: 'spider_mother',
    name: 'Spider Mother',
    description: 'x1.5 X-Mult if no empty column ever appears this round.',
    rarity: 4,
    price: 10,
    glyph: 'X',
    color: 0xb388ff,
    noEmptyColumnXMult: 1.5
  },
  silk_moth: {
    id: 'silk_moth',
    name: 'Silk Moth',
    description: '+0.04 X-Mult every flip (permanent this round).',
    rarity: 4,
    price: 10,
    glyph: 'H',
    color: 0xffefb0,
    onFlipXMultAdd: 0.04
  },
  golden_beetle: {
    id: 'golden_beetle',
    name: 'Golden Beetle',
    description: 'Chips x1.3 on every clear.',
    rarity: 4,
    price: 12,
    glyph: 'G',
    color: 0xffd700,
    clearChipsMult: 1.3
  },
  tarantula: {
    id: 'tarantula',
    name: 'Tarantula',
    description: 'First clear of the round grants +0.5 X-Mult.',
    rarity: 4,
    price: 10,
    glyph: 'T',
    color: 0x6b5b9e,
    firstClearXMultBonus: 0.5
  },
  atlas_moth: {
    id: 'atlas_moth',
    name: 'Atlas Moth',
    description: '+1 Mult per Insect card you own (stacks with itself).',
    rarity: 5,
    price: 15,
    glyph: 'O',
    color: 0xff88ff,
    perInsectMultBonus: 1
  }
}

export type InsectCardId = keyof typeof INSECT_CARDS

export function rollRandomInsect(minRarity: number = 1, maxRarity: number = 5): InsectCardDef {
  const pool = Object.values(INSECT_CARDS).filter(c => c.rarity >= minRarity && c.rarity <= maxRarity)
  return pool[Math.floor(Math.random() * pool.length)]
}
