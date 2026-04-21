import type { Enhancement } from './Enhancement'

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds'

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'] as const

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '\u2660',
  hearts: '\u2665',
  clubs: '\u2663',
  diamonds: '\u2666'
}

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export const RANK_LABELS: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
}

export class Card {
  readonly id: string
  readonly suit: Suit
  readonly rank: Rank
  faceUp: boolean = false
  enhancement: Enhancement = 'none'

  constructor(suit: Suit, rank: Rank, id: string) {
    this.suit = suit
    this.rank = rank
    this.id = id
  }

  get label(): string { return RANK_LABELS[this.rank] }
  get symbol(): string { return SUIT_SYMBOLS[this.suit] }
  get isRed(): boolean { return this.suit === 'hearts' || this.suit === 'diamonds' }
}
