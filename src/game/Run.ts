import { ANTE_TARGETS, COIN_REWARDS, STEP_LIMIT_DEFAULT } from '../config/constants'

export class Run {
  ante: number = 0
  coins: number = 0

  get currentTarget(): number {
    const base = ANTE_TARGETS[Math.min(this.ante, ANTE_TARGETS.length - 1)]
    return this.isBossRound() ? Math.floor(base * 2) : base
  }

  get currentStepLimit(): number {
    return this.isBossRound() ? Math.max(15, STEP_LIMIT_DEFAULT - 5) : STEP_LIMIT_DEFAULT
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

  awardCoins(score: number, stepsLeft: number, clearCount: number): number {
    const base = COIN_REWARDS.CLEAR_BONUS + (score >= this.currentTarget ? 5 : 0)
    const clears = clearCount * COIN_REWARDS.PER_CLEAR
    const steps = Math.max(0, stepsLeft) * COIN_REWARDS.PER_STEP_LEFT
    const interest = Math.min(
      COIN_REWARDS.INTEREST_CAP,
      Math.floor(this.coins / 5) * COIN_REWARDS.INTEREST_PER_5
    )
    const boss = this.isBossRound() ? 15 : 0
    const total = base + clears + steps + interest + boss
    this.coins += total
    return total
  }

  reset(): void {
    this.ante = 0
    this.coins = 0
  }

  isCampaignComplete(): boolean {
    return this.ante >= ANTE_TARGETS.length
  }
}
