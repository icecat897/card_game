import type { Card } from './Card'

/**
 * 从某列的 fromIndex 开始，取出可移动的序列。
 * 规则：单张总是合法；多张需要同花色递减连续；首张必须翻开；
 * petrified（石化）牌不能出现在多张序列内——它只能作为"单张搬运"。
 */
export function getMovableSequence(column: Card[], fromIndex: number): Card[] | null {
  if (fromIndex < 0 || fromIndex >= column.length) return null
  const slice = column.slice(fromIndex)
  if (!slice[0].faceUp) return null
  if (slice.length === 1) return slice
  if (slice.some(c => c.enhancement === 'petrified')) return null
  for (let i = 1; i < slice.length; i++) {
    if (!slice[i].faceUp) return null
    if (slice[i].suit !== slice[i - 1].suit) return null
    if (slice[i].rank !== slice[i - 1].rank - 1) return null
  }
  return slice
}

export function canPlaceOnColumn(sequence: Card[], targetColumn: Card[]): boolean {
  if (sequence.length === 0) return false
  if (targetColumn.length === 0) return true
  const top = targetColumn[targetColumn.length - 1]
  if (!top.faceUp) return false
  // petrified 万能接头：任意一端是石化牌即合法
  if (top.enhancement === 'petrified') return true
  if (sequence[0].enhancement === 'petrified') return true
  return sequence[0].rank === top.rank - 1
}

/**
 * 检测列底部的可消除同花递减序列。
 * petrified 会中断序列（因为它打破同花色判定）。
 */
export function checkClearableSequence(
  column: Card[],
  minLen: number
): { start: number; cards: Card[]; isFullKA: boolean } | null {
  if (column.length === 0) return null
  const end = column.length - 1
  if (!column[end].faceUp) return null
  if (column[end].enhancement === 'petrified') return null
  const suit = column[end].suit
  let start = end
  while (start > 0) {
    const prev = column[start - 1]
    if (!prev.faceUp) break
    if (prev.enhancement === 'petrified') break
    if (prev.suit !== suit) break
    if (prev.rank !== column[start].rank + 1) break
    start--
  }
  const seqLen = end - start + 1
  if (seqLen < minLen) return null

  const isFullKA =
    seqLen >= 13 && column[end - 12].rank === 13 && column[end].rank === 1
  const clearStart = isFullKA ? end - 12 : start
  const cards = column.slice(clearStart, end + 1)
  return { start: clearStart, cards, isFullKA }
}

/**
 * 判断是否存在任何合法移动（用于死锁检测）。
 */
export function hasAnyLegalMove(columns: Card[][]): boolean {
  for (let from = 0; from < columns.length; from++) {
    const col = columns[from]
    for (let idx = 0; idx < col.length; idx++) {
      const seq = getMovableSequence(col, idx)
      if (!seq) continue
      for (let to = 0; to < columns.length; to++) {
        if (to === from) continue
        if (canPlaceOnColumn(seq, columns[to])) return true
      }
    }
  }
  return false
}
