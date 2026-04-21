import { Card, SUITS, type Rank } from './Card'

export function createDecks(seed?: number): Card[] {
  const cards: Card[] = []
  let idCounter = 0
  for (let deck = 0; deck < 2; deck++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push(new Card(suit, rank as Rank, `c${idCounter++}`))
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
