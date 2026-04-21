import { Card, SUITS, type Rank, type Suit } from './Card'

const SUIT_LETTER: Record<Suit, string> = {
  spades: 'S', hearts: 'H', clubs: 'C', diamonds: 'D'
}

export function cardIdOf(suit: Suit, rank: Rank, deckIdx: number): string {
  return `${SUIT_LETTER[suit]}${rank}-${deckIdx}`
}

export function createDecks(seed?: number, removedIds?: ReadonlySet<string>): Card[] {
  const cards: Card[] = []
  for (let deck = 0; deck < 2; deck++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        const id = cardIdOf(suit, rank as Rank, deck)
        if (removedIds?.has(id)) continue
        cards.push(new Card(suit, rank as Rank, id))
      }
    }
  }
  return shuffle(cards, seed)
}

export function shuffle<T>(arr: T[], seed?: number): T[] {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
