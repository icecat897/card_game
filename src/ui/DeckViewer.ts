import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants'
import type { Enhancement } from '../game/Enhancement'
import { ENHANCEMENTS } from '../game/Enhancement'
import { SUITS, SUIT_SYMBOLS, RANK_LABELS, type Rank, type Suit } from '../game/Card'
import { cardIdOf } from '../game/Deck'
import { t } from '../i18n/i18n'

const PANEL_W = 1160
const PANEL_H = 680
const CELL_W = 78
const CELL_H = 60
const CELL_GAP = 6
const GRID_COLS = 13
const GRID_ROWS = 8
const GRID_PAD_X = 22
const GRID_TOP = 106

export class DeckViewer extends Container {
  private dim: Graphics
  private panel: Container
  private titleText: Text
  private summaryText: Text
  private closeLabel: Text
  private gridContainer: Container
  onClose?: () => void
  onHoverDescribe?: (text: string | null, x: number, y: number) => void

  private lastEnhancements: ReadonlyMap<string, Enhancement> = new Map()
  private lastRemoved: ReadonlySet<string> = new Set()

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'static'

    this.dim = new Graphics()
    this.dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.82 })
    this.dim.eventMode = 'static'
    this.dim.on('pointerdown', () => this.handleClose())
    this.addChild(this.dim)

    this.panel = new Container()
    this.panel.x = (GAME_WIDTH - PANEL_W) / 2
    this.panel.y = (GAME_HEIGHT - PANEL_H) / 2
    this.panel.eventMode = 'static'
    this.panel.on('pointerdown', (e) => { e.stopPropagation() })
    const bg = new Graphics()
    bg.roundRect(0, 0, PANEL_W, PANEL_H, 18)
      .fill({ color: 0x1a0f2e })
      .stroke({ width: 3, color: COLORS.accent })
    this.panel.addChild(bg)
    this.addChild(this.panel)

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 30,
        fontWeight: 'bold',
        fill: COLORS.gold,
        letterSpacing: 4
      })
    })
    this.titleText.anchor.set(0.5, 0)
    this.titleText.x = PANEL_W / 2
    this.titleText.y = 24
    this.panel.addChild(this.titleText)

    this.summaryText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        fill: COLORS.textDim,
        letterSpacing: 2
      })
    })
    this.summaryText.anchor.set(0.5, 0)
    this.summaryText.x = PANEL_W / 2
    this.summaryText.y = 66
    this.panel.addChild(this.summaryText)

    const closeBtn = new Container()
    closeBtn.eventMode = 'static'
    closeBtn.cursor = 'pointer'
    const closeBg = new Graphics()
    closeBg.roundRect(0, 0, 110, 36, 8)
      .fill({ color: COLORS.accent })
      .stroke({ width: 1, color: COLORS.gold, alpha: 0.5 })
    closeBtn.addChild(closeBg)
    this.closeLabel = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 3
      })
    })
    this.closeLabel.anchor.set(0.5)
    this.closeLabel.x = 55
    this.closeLabel.y = 18
    closeBtn.addChild(this.closeLabel)
    closeBtn.x = PANEL_W - 140
    closeBtn.y = PANEL_H - 56
    closeBtn.on('pointerover', () => gsap.to(closeBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 }))
    closeBtn.on('pointerout', () => gsap.to(closeBtn.scale, { x: 1, y: 1, duration: 0.15 }))
    closeBtn.on('pointerdown', () => this.handleClose())
    this.panel.addChild(closeBtn)

    this.gridContainer = new Container()
    this.gridContainer.x = GRID_PAD_X
    this.gridContainer.y = GRID_TOP
    this.panel.addChild(this.gridContainer)

    this.applyLang()
  }

  show(enhancements: ReadonlyMap<string, Enhancement>, removed: ReadonlySet<string>): void {
    this.lastEnhancements = enhancements
    this.lastRemoved = removed
    this.renderGrid()
    this.updateSummary()
    this.visible = true
    this.dim.alpha = 0
    this.panel.scale.set(0.88)
    this.panel.alpha = 0
    gsap.to(this.dim, { alpha: 0.82, duration: 0.25 })
    gsap.to(this.panel.scale, { x: 1, y: 1, duration: 0.36, ease: 'back.out(2)' })
    gsap.to(this.panel, { alpha: 1, duration: 0.25 })
  }

  hide(): void {
    gsap.to(this.dim, { alpha: 0, duration: 0.18 })
    gsap.to(this.panel, {
      alpha: 0,
      duration: 0.18,
      onComplete: () => { this.visible = false }
    })
  }

  private handleClose(): void {
    this.hide()
    this.onHoverDescribe?.(null, 0, 0)
    this.onClose?.()
  }

  private updateSummary(): void {
    const total = 104 - this.lastRemoved.size
    const enhanced = this.lastEnhancements.size
    const removed = this.lastRemoved.size
    this.summaryText.text = t('deckviewer.summary', { total, enhanced, removed })
  }

  private renderGrid(): void {
    this.gridContainer.removeChildren()
    for (let deck = 0; deck < 2; deck++) {
      for (let suitIdx = 0; suitIdx < SUITS.length; suitIdx++) {
        const suit = SUITS[suitIdx]
        const row = deck * 4 + suitIdx
        for (let rank = 1; rank <= 13; rank++) {
          const col = rank - 1
          const id = cardIdOf(suit, rank as Rank, deck)
          const enh = this.lastEnhancements.get(id) ?? 'none'
          const removed = this.lastRemoved.has(id)
          const cell = this.makeCell(suit, rank as Rank, enh, removed, id, deck)
          cell.x = col * (CELL_W + CELL_GAP)
          cell.y = row * (CELL_H + CELL_GAP)
          this.gridContainer.addChild(cell)
        }
      }
    }
  }

  private makeCell(suit: Suit, rank: Rank, enh: Enhancement, removed: boolean, id: string, deck: number): Container {
    const c = new Container()
    const enhSpec = ENHANCEMENTS[enh]
    const isRed = suit === 'hearts' || suit === 'diamonds'
    const suitColor = isRed ? 0xd93b4a : 0x1a1625

    const bg = new Graphics()
    const borderColor = removed ? 0x3a2a4a : (enh !== 'none' ? enhSpec.borderColor : 0x3a2a4a)
    const borderWidth = enh !== 'none' && !removed ? 2 : 1
    const fillColor = removed ? 0x15101f : (enh === 'petrified' ? 0xc8c3b8 : COLORS.cardFront)
    const fillAlpha = removed ? 0.55 : 1
    bg.roundRect(0, 0, CELL_W, CELL_H, 6)
      .fill({ color: fillColor, alpha: fillAlpha })
      .stroke({ width: borderWidth, color: borderColor, alpha: removed ? 0.5 : 1 })
    c.addChild(bg)

    if (!removed) {
      const rankStyle = new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: suitColor
      })
      const rankText = new Text({ text: RANK_LABELS[rank], style: rankStyle })
      rankText.x = 6
      rankText.y = 4
      c.addChild(rankText)

      const suitText = new Text({
        text: SUIT_SYMBOLS[suit],
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fill: suitColor
        })
      })
      suitText.anchor.set(0.5)
      suitText.x = CELL_W / 2
      suitText.y = CELL_H / 2 + 4
      c.addChild(suitText)

      if (enh !== 'none' && enhSpec.glyph) {
        const badge = new Text({
          text: enhSpec.glyph,
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 12,
            fontWeight: 'bold',
            fill: enhSpec.borderColor,
            stroke: { color: 0x000000, width: 1, alpha: 0.4 }
          })
        })
        badge.anchor.set(1, 0)
        badge.x = CELL_W - 5
        badge.y = 3
        c.addChild(badge)
      }
    } else {
      // 已删除：画一个 X
      const cross = new Graphics()
      cross.moveTo(12, 12).lineTo(CELL_W - 12, CELL_H - 12)
        .stroke({ width: 2, color: COLORS.danger, alpha: 0.7 })
      cross.moveTo(CELL_W - 12, 12).lineTo(12, CELL_H - 12)
        .stroke({ width: 2, color: COLORS.danger, alpha: 0.7 })
      c.addChild(cross)

      const label = new Text({
        text: t('deckviewer.removed_label'),
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 9,
          fill: COLORS.danger,
          letterSpacing: 1
        })
      })
      label.anchor.set(0.5)
      label.x = CELL_W / 2
      label.y = CELL_H - 10
      c.addChild(label)
    }

    const deckIdxBadge = new Text({
      text: deck === 0 ? '\u2460' : '\u2461',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 9,
        fill: COLORS.textDim
      })
    })
    deckIdxBadge.x = 4
    deckIdxBadge.y = CELL_H - 13
    c.addChild(deckIdxBadge)

    c.eventMode = 'static'
    c.cursor = 'default'
    c.on('pointerover', () => {
      gsap.to(c.scale, { x: 1.08, y: 1.08, duration: 0.12 })
      const label = `${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}  (${deck === 0 ? 'Deck 1' : 'Deck 2'})`
      const enhLine = removed
        ? `[${t('deckviewer.removed_label')}]`
        : (enh !== 'none' ? `${enhSpec.displayName}: ${enhSpec.description}` : '')
      const pos = c.getGlobalPosition()
      const hoverText = enhLine ? `${label}\n${enhLine}` : label
      this.onHoverDescribe?.(hoverText, pos.x + CELL_W / 2, pos.y + CELL_H + 6)
      void id
    })
    c.on('pointerout', () => {
      gsap.to(c.scale, { x: 1, y: 1, duration: 0.12 })
      this.onHoverDescribe?.(null, 0, 0)
    })
    return c
  }

  applyLang(): void {
    this.titleText.text = t('deckviewer.title')
    this.closeLabel.text = t('deckviewer.close')
    if (this.visible) {
      this.updateSummary()
      this.renderGrid()
    }
  }
}
