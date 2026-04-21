import { SCORING } from '../config/constants'

export class ComboTracker {
  private streakCount: number = 0

  recordMove(sameSuit: boolean): number {
    if (!sameSuit) {
      this.streakCount = 0
      return 1
    }
    this.streakCount++
    if (this.streakCount < SCORING.COMBO_MIN) return 1
    const overflow = this.streakCount - SCORING.COMBO_MIN + 1
    return Math.pow(SCORING.COMBO_MULT_BASE, overflow)
  }

  breakCombo(): void { this.streakCount = 0 }
  reset(): void { this.streakCount = 0 }
  get streak(): number { return this.streakCount }
}
