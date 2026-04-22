export type CharacterId = 'weaver' | 'hamster' | 'mantis_warrior'

export interface CharacterEffect {
  /** +N 个常规昆虫槽（默认 5） */
  extraInsectSlot?: number
  /** +N 利息上限 */
  extraInterestCap?: number
  /** 起始金币 +N（可负） */
  startCoins?: number
  /** 起始送一张昆虫卡 id */
  startingInsectId?: string
  /** 每次移动静态加 Chips（非昆虫来源） */
  moveChipsBonus?: number
  /** 出售价格乘数（如 1.2 = 售价多 20%） */
  sellPriceMult?: number
}

export interface CharacterDef {
  id: CharacterId
  name: string
  description: string
  glyph: string
  color: number
  effect: CharacterEffect
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  weaver: {
    id: 'weaver',
    name: 'Weaver',
    description: 'Balanced starter. Starts with Firefly.',
    glyph: '\u262E',
    color: 0xa88fd0,
    effect: {
      startingInsectId: 'firefly'
    }
  },
  hamster: {
    id: 'hamster',
    name: 'Hoarder Hamster',
    description: '+1 insect slot · +$6 start · Interest cap +2 · Sell +20% · Starts with Egg.',
    glyph: '\u266D',
    color: 0xc89868,
    effect: {
      extraInsectSlot: 1,
      extraInterestCap: 2,
      startCoins: 6,
      startingInsectId: 'egg',
      sellPriceMult: 1.2
    }
  },
  mantis_warrior: {
    id: 'mantis_warrior',
    name: 'Mantis Blade',
    description: '+5 Chips per move · -$2 start · Starts with Mantis.',
    glyph: '\u2694',
    color: 0x7fa060,
    effect: {
      startingInsectId: 'mantis',
      moveChipsBonus: 5,
      startCoins: -2
    }
  }
}

export const DEFAULT_CHARACTER_ID: CharacterId = 'weaver'

export function getCharacter(id: CharacterId | string | null | undefined): CharacterDef {
  if (id && id in CHARACTERS) return CHARACTERS[id as CharacterId]
  return CHARACTERS[DEFAULT_CHARACTER_ID]
}
