import { SCORING } from '../config/constants'
import { ComboTracker } from './ComboTracker'
import type { MoveResult } from '../game/Board'
import { ENHANCEMENTS } from '../game/Enhancement'
import type { Inventory } from '../game/Inventory'

export interface ScoreBreakdown {
  chips: number
  mult: number
  comboMult: number
  xmult: number
  total: number
  isFullKA: boolean
  coinBonus: number
  stepRefund: number
}

export class ScoreEngine {
  private totalScore: number = 0
  private combo: ComboTracker = new ComboTracker()
  private clearCountThisRound: number = 0
  private xmult: number = 1
  private flipMultAccumulated: number = 0
  private emptyEverAppeared: boolean = false
  private firstClearDone: boolean = false
  private scrollsUsedThisRound: number = 0
  private nextMoveScoreMult: number = 1
  private inventory?: Inventory

  setInventory(inv: Inventory): void { this.inventory = inv }

  getTotal(): number { return this.totalScore }
  getClearCount(): number { return this.clearCountThisRound }
  getComboStreak(): number { return this.combo.streak }
  getXMult(): number { return this.xmult }

  bumpCombo(n: number): void {
    for (let i = 0; i < n; i++) this.combo.recordMove(true)
  }

  onScrollUsed(): void { this.scrollsUsedThisRound++ }
  queueScoreMult(v: number): void { this.nextMoveScoreMult *= v }

  scoreMove(move: MoveResult, emptyColumnCount: number): ScoreBreakdown {
    if (emptyColumnCount > 0) this.emptyEverAppeared = true

    let chips = SCORING.CHIPS_PER_MOVE * move.sequenceLength * move.sequenceLength
    let mult = 1
    let clearMultMultiplier = 1
    let clearChipsMultiplier = 1
    let coinBonus = 0
    let stepRefund = 0

    for (const card of move.movedCards) {
      const spec = ENHANCEMENTS[card.enhancement]
      chips += spec.chipsBonus
      mult += spec.multBonus
    }

    if (this.inventory) {
      const insectCount = this.inventory.insects.length
      for (const ins of this.inventory.insects) {
        const d = ins.def
        if (d.onMoveChipsBonus) chips += d.onMoveChipsBonus
        if (d.onMoveMultBonus) mult += d.onMoveMultBonus
        if (d.redCardChipsBonus) {
          const redCount = move.movedCards.filter(c => c.isRed).length
          chips += redCount * d.redCardChipsBonus
        }
        if (d.lowRankMultMult && move.movedCards.some(c => c.rank <= 2)) {
          mult *= d.lowRankMultMult
        }
        if (d.perInsectMultBonus) mult += d.perInsectMultBonus * insectCount
        if (d.scrollUseMultAccum) mult += d.scrollUseMultAccum * this.scrollsUsedThisRound
      }
    }

    if (move.flippedCard) {
      chips += SCORING.CHIPS_PER_FLIP
      const flipSpec = ENHANCEMENTS[move.flippedCard.enhancement]
      coinBonus += flipSpec.flipCoinBonus
      if (this.inventory) {
        for (const ins of this.inventory.insects) {
          if (ins.def.onFlipMultAccum) this.flipMultAccumulated += ins.def.onFlipMultAccum
          if (ins.def.onFlipXMultAdd) this.xmult += ins.def.onFlipXMultAdd
        }
      }
    }

    if (move.intoEmptyColumn) chips += SCORING.CHIPS_EMPTY_COLUMN
    if (move.cleared) {
      chips += SCORING.CHIPS_CLEAR_BASE + move.cleared.cards.length * 5
      if (move.cleared.isFullKA) chips += SCORING.CHIPS_KA_BONUS
      for (const c of move.cleared.cards) {
        const spec = ENHANCEMENTS[c.enhancement]
        this.xmult += spec.clearXMultAdd
        clearMultMultiplier *= spec.clearMultMult
      }
      if (this.inventory) {
        for (const ins of this.inventory.insects) {
          if (ins.def.onClearXMultAdd) this.xmult += ins.def.onClearXMultAdd
          if (ins.def.onClearStepRefund) stepRefund += ins.def.onClearStepRefund
          if (ins.def.clearCoinBonus) coinBonus += ins.def.clearCoinBonus
          if (ins.def.clearChipsMult) clearChipsMultiplier *= ins.def.clearChipsMult
          if (ins.def.firstClearXMultBonus && !this.firstClearDone) {
            this.xmult += ins.def.firstClearXMultBonus
          }
        }
      }
      this.firstClearDone = true
      this.clearCountThisRound++
    }

    mult += this.clearCountThisRound * SCORING.MULT_PER_CLEAR
    let emptyMultPer: number = SCORING.MULT_PER_EMPTY_COLUMN
    if (this.inventory) {
      for (const ins of this.inventory.insects) {
        if (ins.def.emptyColumnMultOverride !== undefined) {
          emptyMultPer = Math.max(emptyMultPer, ins.def.emptyColumnMultOverride)
        }
      }
    }
    mult += emptyColumnCount * emptyMultPer

    if (move.flippedCard) mult += SCORING.MULT_ON_FLIP
    if (move.cleared?.isFullKA) mult += SCORING.MULT_PER_KA_BONUS
    mult += this.flipMultAccumulated

    if (move.cleared?.isFullKA) {
      this.xmult += SCORING.KA_XMULT_BONUS
    }

    chips *= clearChipsMultiplier

    let effectiveXMult = this.xmult
    if (this.inventory && !this.emptyEverAppeared) {
      for (const ins of this.inventory.insects) {
        if (ins.def.noEmptyColumnXMult) effectiveXMult *= ins.def.noEmptyColumnXMult
      }
    }

    const comboMult = this.combo.recordMove(move.sameSuit)
    const burstMult = this.nextMoveScoreMult
    this.nextMoveScoreMult = 1
    const totalMult = mult * clearMultMultiplier * comboMult * effectiveXMult * burstMult
    const total = Math.floor(chips * totalMult)
    this.totalScore += total

    return {
      chips,
      mult: mult * clearMultMultiplier * burstMult,
      comboMult,
      xmult: effectiveXMult,
      total,
      isFullKA: !!move.cleared?.isFullKA,
      coinBonus,
      stepRefund
    }
  }

  onStockDeal(): void { this.combo.breakCombo() }

  resetForNextLevel(): void {
    this.totalScore = 0
    this.clearCountThisRound = 0
    this.combo.reset()
    this.xmult = 1
    this.flipMultAccumulated = 0
    this.emptyEverAppeared = false
    this.firstClearDone = false
    this.scrollsUsedThisRound = 0
    this.nextMoveScoreMult = 1
  }

  resetAll(): void {
    this.resetForNextLevel()
  }
}
