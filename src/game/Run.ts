import { ANTE_TARGETS, COIN_REWARDS, STEP_LIMIT_DEFAULT } from '../config/constants'
import type { Enhancement } from './Enhancement'
import { pickBossForAnte, type BossDef } from './Boss'
import { getCharacter, DEFAULT_CHARACTER_ID, type CharacterDef, type CharacterId } from './Character'

export class Run {
  ante: number = 0
  coins: number = 0
  /** Persistent enhancements keyed by stable card id (e.g. "S1-0"). Survives across levels within a run. */
  deckEnhancements: Map<string, Enhancement> = new Map()
  /** Card ids permanently removed from the deck this run. */
  removedCardIds: Set<string> = new Set()
  /** 下一次开商店时对价格应用的乘数（例如 hoarder boss 后 1.4） */
  nextShopMarkup: number = 1
  /** 当前 run 的角色 id */
  characterId: CharacterId = DEFAULT_CHARACTER_ID

  get character(): CharacterDef {
    return getCharacter(this.characterId)
  }

  get currentBoss(): BossDef | null {
    return this.isBossRound() ? pickBossForAnte(this.ante) : null
  }

  get currentTarget(): number {
    const base = ANTE_TARGETS[Math.min(this.ante, ANTE_TARGETS.length - 1)]
    if (this.isBossRound()) {
      const mult = this.currentBoss?.effect.targetMult ?? 2
      return Math.floor(base * mult)
    }
    return base
  }

  get currentStepLimit(): number {
    if (this.isBossRound()) {
      const extra = this.currentBoss?.effect.stepPenalty ?? 0
      return Math.max(12, STEP_LIMIT_DEFAULT - 5 - extra)
    }
    return STEP_LIMIT_DEFAULT
  }

  isBossRound(): boolean {
    return (this.ante + 1) % 3 === 0
  }

  isFinalAnte(): boolean {
    return this.ante >= ANTE_TARGETS.length - 1
  }

  getAnteLabel(): string {
    return `ANTE ${this.ante + 1}`
  }

  advance(): void {
    this.ante++
  }

  /** 考虑角色加成的利息上限 */
  getInterestCap(): number {
    return COIN_REWARDS.INTEREST_CAP + (this.character.effect.extraInterestCap ?? 0)
  }

  getInterestAmount(): number {
    return Math.min(
      this.getInterestCap(),
      Math.floor(this.coins / 5) * COIN_REWARDS.INTEREST_PER_5
    )
  }

  awardCoins(score: number, stepsLeft: number, clearCount: number): number {
    const base = COIN_REWARDS.CLEAR_BONUS + (score >= this.currentTarget ? 5 : 0)
    const clears = clearCount * COIN_REWARDS.PER_CLEAR
    const steps = Math.max(0, stepsLeft) * COIN_REWARDS.PER_STEP_LEFT
    const interest = this.getInterestAmount()
    const boss = this.isBossRound() ? 15 : 0
    const total = base + clears + steps + interest + boss
    this.coins += total
    return total
  }

  /** 设置角色并应用起始金币等效果 */
  setCharacter(id: CharacterId): void {
    this.characterId = id
    const eff = this.character.effect
    this.coins = Math.max(0, (eff.startCoins ?? 0))
  }

  reset(keepCharacter: boolean = false): void {
    const prevChar = this.characterId
    this.ante = 0
    this.coins = 0
    this.deckEnhancements.clear()
    this.removedCardIds.clear()
    this.nextShopMarkup = 1
    if (keepCharacter) this.setCharacter(prevChar)
    else this.characterId = DEFAULT_CHARACTER_ID
  }

  isCampaignComplete(): boolean {
    return this.ante >= ANTE_TARGETS.length
  }
}
