import { Card } from './Card'
import { createDecks } from './Deck'
import { canPlaceOnColumn, checkClearableSequence, getMovableSequence, hasAnyLegalMove } from './Rules'
import { COLUMN_COUNT, SCORING } from '../config/constants'

export interface ClearResult {
  columnIndex: number
  cards: Card[]
  isFullKA: boolean
}

export interface MoveResult {
  movedCards: Card[]
  flippedCard?: Card
  cleared?: ClearResult
  sequenceLength: number
  intoEmptyColumn: boolean
  sameSuit: boolean
}

export interface DealResult {
  cards: Card[]
  perColumn: Array<{ col: number; card: Card }>
}

export class Board {
  columns: Card[][] = []
  stock: Card[] = []
  collected: Card[][] = []
  clearCount: number = 0
  kaCount: number = 0

  constructor(seed?: number) {
    this.reset(seed)
  }

  reset(seed?: number): void {
    const allCards = createDecks(seed)
    this.columns = Array.from({ length: COLUMN_COUNT }, () => [])
    this.collected = []
    this.clearCount = 0
    this.kaCount = 0
    let idx = 0
    for (let col = 0; col < COLUMN_COUNT; col++) {
      const count = col < 4 ? 6 : 5
      for (let i = 0; i < count; i++) this.columns[col].push(allCards[idx++])
      this.columns[col][count - 1].faceUp = true
    }
    this.stock = allCards.slice(idx)
  }

  tryMove(fromCol: number, fromIdx: number, toCol: number): MoveResult | null {
    if (fromCol === toCol) return null
    const source = this.columns[fromCol]
    const target = this.columns[toCol]
    const seq = getMovableSequence(source, fromIdx)
    if (!seq) return null
    if (!canPlaceOnColumn(seq, target)) return null

    const intoEmptyColumn = target.length === 0
    const targetTopBefore = target[target.length - 1]
    const sameSuit =
      seq.length >= 2 ||
      (targetTopBefore !== undefined && targetTopBefore.suit === seq[0].suit)

    source.splice(fromIdx, seq.length)
    target.push(...seq)

    let flippedCard: Card | undefined
    if (source.length > 0) {
      const last = source[source.length - 1]
      if (!last.faceUp) {
        last.faceUp = true
        flippedCard = last
      }
    }

    let cleared: ClearResult | undefined
    const clr = checkClearableSequence(target, SCORING.SEQUENCE_MIN_TO_CLEAR)
    if (clr) {
      const removed = target.splice(clr.start, clr.cards.length)
      this.collected.push(removed)
      this.clearCount++
      if (clr.isFullKA) this.kaCount++
      cleared = { columnIndex: toCol, cards: removed, isFullKA: clr.isFullKA }
      if (target.length > 0) {
        const last = target[target.length - 1]
        if (!last.faceUp) {
          last.faceUp = true
          flippedCard = last
        }
      }
    }

    return {
      movedCards: seq,
      flippedCard,
      cleared,
      sequenceLength: seq.length,
      intoEmptyColumn,
      sameSuit
    }
  }

  /** 发牌堆发一轮：每列顶部加一张翻开的牌 */
  dealStock(): DealResult | null {
    if (this.columns.some(c => c.length === 0)) return null
    if (this.stock.length < COLUMN_COUNT) return null
    const perColumn: DealResult['perColumn'] = []
    const cards: Card[] = []
    for (let col = 0; col < COLUMN_COUNT; col++) {
      const card = this.stock.shift()!
      card.faceUp = true
      this.columns[col].push(card)
      perColumn.push({ col, card })
      cards.push(card)
    }
    return { cards, perColumn }
  }

  canDealStock(): boolean {
    return this.columns.every(c => c.length > 0) && this.stock.length >= COLUMN_COUNT
  }

  stockRoundsLeft(): number {
    return Math.floor(this.stock.length / COLUMN_COUNT)
  }

  emptyColumnCount(): number {
    return this.columns.filter(c => c.length === 0).length
  }

  hasLegalMove(): boolean {
    return hasAnyLegalMove(this.columns)
  }

  /** 真正死锁：没有合法移动 + 无法发牌 */
  isDeadlocked(): boolean {
    return !this.hasLegalMove() && !this.canDealStock()
  }
}
