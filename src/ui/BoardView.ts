import { Container, FederatedPointerEvent, Graphics } from 'pixi.js'
import { Board } from '../game/Board'
import { Card } from '../game/Card'
import { getMovableSequence } from '../game/Rules'
import { CardSprite } from './CardSprite'
import {
  CARD_HEIGHT, CARD_WIDTH, COLUMN_COUNT, COLUMN_GAP, COLUMN_START_X, COLUMN_Y,
  CARD_STACK_OFFSET_CLOSED, CARD_STACK_OFFSET_OPEN, COLORS, GAME_HEIGHT
} from '../config/constants'

export interface MoveAttempt {
  fromCol: number
  fromIdx: number
  toCol: number
}

export type BoardMode = 'drag' | 'target'

export class BoardView extends Container {
  private board: Board
  private sprites: Map<string, CardSprite> = new Map()
  private columnSlots: Graphics[] = []
  private dragged: CardSprite[] | null = null
  private dragSource: { col: number; idx: number } | null = null
  private dragOffset = { x: 0, y: 0 }

  mode: BoardMode = 'drag'
  onMoveAttempt?: (attempt: MoveAttempt) => Promise<boolean> | boolean
  onCardTargeted?: (card: Card) => void

  constructor(board: Board) {
    super()
    this.board = board
    this.eventMode = 'static'
    this.hitArea = { contains: () => true } as any
    this.buildColumnSlots()
    this.buildAllSprites()
    this.layout(true)
  }

  private buildColumnSlots(): void {
    for (let i = 0; i < COLUMN_COUNT; i++) {
      const g = new Graphics()
      g.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8)
      g.stroke({ width: 1.5, color: COLORS.accent, alpha: 0.22 })
      g.x = COLUMN_START_X + i * COLUMN_GAP
      g.y = COLUMN_Y
      this.addChild(g)
      this.columnSlots.push(g)
    }
  }

  private buildAllSprites(): void {
    const all: Card[] = []
    this.board.columns.forEach(col => all.push(...col))
    for (const card of all) {
      const sprite = new CardSprite(card)
      sprite.eventMode = 'static'
      sprite.cursor = 'pointer'
      sprite.on('pointerdown', (e) => this.onCardPointerDown(e, card))
      this.addChild(sprite)
      this.sprites.set(card.id, sprite)
    }
  }

  /** 按 board 当前状态重新布局 */
  layout(instant = false): void {
    for (let col = 0; col < COLUMN_COUNT; col++) {
      const column = this.board.columns[col]
      const colX = COLUMN_START_X + col * COLUMN_GAP
      let y = COLUMN_Y
      for (let i = 0; i < column.length; i++) {
        const card = column[i]
        const sprite = this.sprites.get(card.id)!
        if (instant) sprite.setHome(colX, y, true)
        else {
          sprite.homeX = colX
          sprite.homeY = y
          sprite.moveTo(colX, y, 0.22)
        }
        this.addChild(sprite)
        y += card.faceUp ? CARD_STACK_OFFSET_OPEN : CARD_STACK_OFFSET_CLOSED
      }
    }
  }

  removeCards(cards: Card[]): void {
    for (const card of cards) {
      const sprite = this.sprites.get(card.id)
      if (sprite) {
        this.removeChild(sprite)
        sprite.destroy()
        this.sprites.delete(card.id)
      }
    }
  }

  /** 将卡牌从视图中取出但不销毁（供 FX 层接管） */
  detachCards(cards: Card[]): CardSprite[] {
    const out: CardSprite[] = []
    for (const card of cards) {
      const sprite = this.sprites.get(card.id)
      if (sprite) {
        this.removeChild(sprite)
        this.sprites.delete(card.id)
        out.push(sprite)
      }
    }
    return out
  }

  getSprite(card: Card): CardSprite | undefined {
    return this.sprites.get(card.id)
  }

  /** 根据 board 当前状态，为尚未创建 sprite 的牌补上 sprite；返回新建的牌列表 */
  syncSprites(): Card[] {
    const newlyAdded: Card[] = []
    for (const col of this.board.columns) {
      for (const card of col) {
        if (!this.sprites.has(card.id)) {
          const sprite = new CardSprite(card)
          sprite.eventMode = 'static'
          sprite.cursor = 'pointer'
          sprite.on('pointerdown', (e) => this.onCardPointerDown(e, card))
          this.addChild(sprite)
          this.sprites.set(card.id, sprite)
          newlyAdded.push(card)
        }
      }
    }
    return newlyAdded
  }

  /** 清空所有精灵（下一关重置时） */
  destroyAllSprites(): void {
    for (const sprite of this.sprites.values()) {
      this.removeChild(sprite)
      sprite.destroy()
    }
    this.sprites.clear()
  }

  /** 重置：在 Board.reset() 之后调用，重建全部精灵 */
  rebuild(): void {
    this.destroyAllSprites()
    this.buildAllSprites()
    this.layout(true)
  }

  private onCardPointerDown(e: FederatedPointerEvent, card: Card): void {
    if (this.mode === 'target') {
      if (card.faceUp) this.onCardTargeted?.(card)
      return
    }
    let col = -1, idx = -1
    for (let c = 0; c < this.board.columns.length; c++) {
      const i = this.board.columns[c].indexOf(card)
      if (i !== -1) { col = c; idx = i; break }
    }
    if (col === -1) return

    const seq = getMovableSequence(this.board.columns[col], idx)
    if (!seq) return

    this.dragged = seq.map(c => this.sprites.get(c.id)!)
    this.dragSource = { col, idx }

    const first = this.dragged[0]
    const pos = e.getLocalPosition(this)
    this.dragOffset.x = pos.x - first.x
    this.dragOffset.y = pos.y - first.y

    this.dragged.forEach(s => {
      this.addChild(s)
      s.alpha = 0.95
      s.scale.set(1.03)
    })

    this.on('globalpointermove', this.onPointerMove, this)
    this.on('pointerup', this.onPointerUp, this)
    this.on('pointerupoutside', this.onPointerUp, this)
  }

  private onPointerMove = (e: FederatedPointerEvent) => {
    if (!this.dragged) return
    const pos = e.getLocalPosition(this)
    const baseX = pos.x - this.dragOffset.x
    const baseY = pos.y - this.dragOffset.y
    this.dragged.forEach((s, i) => {
      s.x = baseX
      s.y = baseY + i * CARD_STACK_OFFSET_OPEN
    })
  }

  private onPointerUp = async (e: FederatedPointerEvent) => {
    this.off('globalpointermove', this.onPointerMove, this)
    this.off('pointerup', this.onPointerUp, this)
    this.off('pointerupoutside', this.onPointerUp, this)
    if (!this.dragged || !this.dragSource) return

    const pos = e.getLocalPosition(this)
    const targetCol = this.findColumnAt(pos.x, pos.y)

    this.dragged.forEach(s => { s.alpha = 1; s.scale.set(1) })

    let ok = false
    if (targetCol !== -1 && targetCol !== this.dragSource.col) {
      const attempt: MoveAttempt = {
        fromCol: this.dragSource.col,
        fromIdx: this.dragSource.idx,
        toCol: targetCol
      }
      ok = await Promise.resolve(this.onMoveAttempt?.(attempt) ?? false)
    }
    if (!ok) this.dragged.forEach(s => s.snapBack())

    this.dragged = null
    this.dragSource = null
  }

  private findColumnAt(x: number, y: number): number {
    if (y < COLUMN_Y - 20 || y > GAME_HEIGHT) return -1
    for (let col = 0; col < COLUMN_COUNT; col++) {
      const colX = COLUMN_START_X + col * COLUMN_GAP
      if (x >= colX - 14 && x <= colX + CARD_WIDTH + 14) return col
    }
    return -1
  }
}
