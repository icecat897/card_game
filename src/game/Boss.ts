export type BossId = 'weaver' | 'eater' | 'hoarder' | 'mist'

export interface BossEffect {
  /** K-A / 消除时 Chips 乘以本值（<1 削弱） */
  clearChipsPenalty?: number
  /** 本关额外 -N 步（默认 boss 已 -5） */
  stepPenalty?: number
  /** 目标分倍率（默认 boss 为 2.0） */
  targetMult?: number
  /** 本关不自动分配强化 */
  noEnhancementReveal?: boolean
  /** 通过后下一次商店价格乘本值（如 1.4） */
  shopMarkup?: number
}

export interface BossDef {
  id: BossId
  /** 仅作 fallback，真实显示走 i18n */
  name: string
  /** 仅作 fallback，真实显示走 i18n */
  description: string
  icon: string
  color: number
  effect: BossEffect
}

export const BOSSES: Record<BossId, BossDef> = {
  weaver: {
    id: 'weaver',
    name: 'The Weaver',
    description: 'K-A clears grant only 60% Chips. Rely on Combos.',
    icon: '\u29EB',
    color: 0xa085ff,
    effect: { clearChipsPenalty: 0.6 }
  },
  eater: {
    id: 'eater',
    name: 'The Eater',
    description: 'Target -20%, but -3 more steps.',
    icon: '\u2620',
    color: 0x70b060,
    effect: { stepPenalty: 3, targetMult: 1.6 }
  },
  hoarder: {
    id: 'hoarder',
    name: 'The Hoarder',
    description: 'Next shop prices +40%.',
    icon: '\u2625',
    color: 0xe0a040,
    effect: { shopMarkup: 1.4 }
  },
  mist: {
    id: 'mist',
    name: 'The Mist',
    description: 'No random enhancements this round.',
    icon: '\u269B',
    color: 0x70a0d0,
    effect: { noEnhancementReveal: true }
  }
}

const ROTATION: BossId[] = ['weaver', 'eater', 'mist', 'hoarder']

/** 根据当前 ante 顺序选 boss；保证同一 run 内顺序可预期 */
export function pickBossForAnte(ante: number): BossDef {
  // ante 是 0-index；boss 发生在 ante 2, 5, 8 … 取 ante/3 作 bossIndex
  const idx = Math.floor(ante / 3) % ROTATION.length
  return BOSSES[ROTATION[idx]]
}
