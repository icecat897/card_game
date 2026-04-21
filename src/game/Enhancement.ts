export type Enhancement =
  | 'none'
  | 'silk'        // 丝絮：移动时 +30 Chips
  | 'venom'       // 毒腺：移动时 +5 Mult
  | 'gilded'      // 金蛛丝：参与消除时 X-Mult +0.15
  | 'brittle'     // 薄茧：消除时该次 ×1.8 Mult
  | 'dewdrop'     // 珠露：翻开时 +$4
  | 'petrified'   // 石化：万能接头（可放任何牌上/下）

export interface EnhancementSpec {
  id: Enhancement
  displayName: string
  chipsBonus: number
  multBonus: number
  clearXMultAdd: number
  clearMultMult: number
  flipCoinBonus: number
  anyConnect: boolean
  borderColor: number
  glyph?: string
  description: string
}

export const ENHANCEMENTS: Record<Enhancement, EnhancementSpec> = {
  none: {
    id: 'none',
    displayName: '',
    chipsBonus: 0,
    multBonus: 0,
    clearXMultAdd: 0,
    clearMultMult: 1,
    flipCoinBonus: 0,
    anyConnect: false,
    borderColor: 0x3a2155,
    description: ''
  },
  silk: {
    id: 'silk',
    displayName: 'Silk',
    chipsBonus: 30,
    multBonus: 0,
    clearXMultAdd: 0,
    clearMultMult: 1,
    flipCoinBonus: 0,
    anyConnect: false,
    borderColor: 0x4a9eff,
    glyph: '\u2756',
    description: '+30 Chips when moved'
  },
  venom: {
    id: 'venom',
    displayName: 'Venom',
    chipsBonus: 0,
    multBonus: 5,
    clearXMultAdd: 0,
    clearMultMult: 1,
    flipCoinBonus: 0,
    anyConnect: false,
    borderColor: 0xff5a5f,
    glyph: '\u26a1',
    description: '+5 Mult when moved'
  },
  gilded: {
    id: 'gilded',
    displayName: 'Gilded',
    chipsBonus: 0,
    multBonus: 0,
    clearXMultAdd: 0.15,
    clearMultMult: 1,
    flipCoinBonus: 0,
    anyConnect: false,
    borderColor: 0xffd67a,
    glyph: '\u2726',
    description: '+0.15 X-Mult when cleared'
  },
  brittle: {
    id: 'brittle',
    displayName: 'Brittle',
    chipsBonus: 0,
    multBonus: 0,
    clearXMultAdd: 0,
    clearMultMult: 1.8,
    flipCoinBonus: 0,
    anyConnect: false,
    borderColor: 0xa8e0ff,
    glyph: '\u2747',
    description: 'x1.8 Mult when cleared'
  },
  dewdrop: {
    id: 'dewdrop',
    displayName: 'Dewdrop',
    chipsBonus: 0,
    multBonus: 0,
    clearXMultAdd: 0,
    clearMultMult: 1,
    flipCoinBonus: 4,
    anyConnect: false,
    borderColor: 0xffe08a,
    glyph: '\u2756',
    description: '+$4 when flipped'
  },
  petrified: {
    id: 'petrified',
    displayName: 'Petrified',
    chipsBonus: 0,
    multBonus: 0,
    clearXMultAdd: 0,
    clearMultMult: 1,
    flipCoinBonus: 0,
    anyConnect: true,
    borderColor: 0x8a8880,
    glyph: '\u25C6',
    description: 'Any rank connects'
  }
}
