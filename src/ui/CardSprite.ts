import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { Card } from '../game/Card'
import { ENHANCEMENTS } from '../game/Enhancement'
import { CARD_WIDTH, CARD_HEIGHT, COLORS, ANIM } from '../config/constants'

export class CardSprite extends Container {
  readonly card: Card
  readonly inner: Container
  private bg: Graphics
  private content: Container

  homeX: number = 0
  homeY: number = 0

  constructor(card: Card) {
    super()
    this.card = card
    this.inner = new Container()
    this.inner.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2)
    this.inner.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2)
    // 卡牌投影（固定绘制一次，不随翻面重画）
    const shadow = new Graphics()
    shadow.roundRect(3, 5, CARD_WIDTH, CARD_HEIGHT, 9)
      .fill({ color: 0x000000, alpha: 0.38 })
    this.inner.addChild(shadow)
    this.addChild(this.inner)
    this.bg = new Graphics()
    this.content = new Container()
    this.inner.addChild(this.bg, this.content)
    this.redraw()
  }

  redraw(): void {
    this.bg.clear()
    this.content.removeChildren()
    if (this.card.faceUp) this.drawFront()
    else this.drawBack()
  }

  private drawFront(): void {
    const enh = ENHANCEMENTS[this.card.enhancement]
    const isPetrified = this.card.enhancement === 'petrified'
    const fillColor = isPetrified ? 0xc8c3b8 : COLORS.cardFront
    const edgeColor = enh.id === 'none' ? COLORS.cardFrontEdge : enh.borderColor
    const borderWidth = enh.id === 'none' ? 2 : 3

    // 主体
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8).fill({ color: fillColor })
    // 上半部略亮的渐层（用 3 段矩形模拟线性渐变）
    if (!isPetrified) {
      this.bg.roundRect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT / 3, 7)
        .fill({ color: 0xfff8e4, alpha: 0.4 })
      this.bg.rect(2, CARD_HEIGHT - 10, CARD_WIDTH - 4, 8)
        .fill({ color: 0x000000, alpha: 0.06 })
    }
    // 内细线描边
    this.bg.roundRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6, 6)
      .stroke({ width: 0.5, color: 0x8a7a5c, alpha: 0.35 })
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8).stroke({ width: borderWidth, color: edgeColor })

    // 强化背景光晕（gilded / brittle）
    if (this.card.enhancement === 'gilded') {
      this.bg.roundRect(2, 2, CARD_WIDTH - 4, CARD_HEIGHT - 4, 6)
        .stroke({ width: 1, color: 0xffe7a8, alpha: 0.65 })
    }
    if (this.card.enhancement === 'brittle') {
      const cracks = new Graphics()
      cracks.moveTo(20, 10).lineTo(40, 50).lineTo(28, 80)
        .stroke({ width: 1, color: 0xffffff, alpha: 0.35 })
      cracks.moveTo(60, 20).lineTo(48, 60).lineTo(68, 96)
        .stroke({ width: 1, color: 0xffffff, alpha: 0.25 })
      this.content.addChild(cracks)
    }
    if (this.card.enhancement === 'petrified') {
      const grain = new Graphics()
      for (let i = 0; i < 12; i++) {
        const x = 6 + Math.random() * (CARD_WIDTH - 12)
        const y = 6 + Math.random() * (CARD_HEIGHT - 12)
        grain.circle(x, y, 1).fill({ color: 0x6a685e, alpha: 0.4 })
      }
      this.content.addChild(grain)
    }

    const suitColor = isPetrified ? 0x4a4840 : (this.card.isRed ? 0xd93b4a : 0x1a1625)
    const rankStyle = new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: suitColor
    })
    const suitStyleSmall = new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fill: suitColor
    })
    const centerSuitStyle = new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 42,
      fill: suitColor
    })

    if (!isPetrified) {
      const tl = new Text({ text: this.card.label, style: rankStyle })
      tl.x = 7
      tl.y = 4
      const tlSuit = new Text({ text: this.card.symbol, style: suitStyleSmall })
      tlSuit.x = 8
      tlSuit.y = 28

      const center = new Text({ text: this.card.symbol, style: centerSuitStyle })
      center.anchor.set(0.5)
      center.x = CARD_WIDTH / 2
      center.y = CARD_HEIGHT / 2 + 4

      const br = new Text({ text: this.card.label, style: rankStyle })
      br.anchor.set(1, 1)
      br.x = CARD_WIDTH - 7
      br.y = CARD_HEIGHT - 4
      const brSuit = new Text({ text: this.card.symbol, style: suitStyleSmall })
      brSuit.anchor.set(1, 1)
      brSuit.x = CARD_WIDTH - 8
      brSuit.y = CARD_HEIGHT - 28

      this.content.addChild(tl, tlSuit, center, br, brSuit)
    } else {
      const mark = new Text({
        text: '\u25C6',
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 46, fill: 0x4a4840 })
      })
      mark.anchor.set(0.5)
      mark.x = CARD_WIDTH / 2
      mark.y = CARD_HEIGHT / 2
      this.content.addChild(mark)
    }

    if (enh.glyph && !isPetrified) {
      const badge = new Text({
        text: enh.glyph,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          fontWeight: 'bold',
          fill: enh.borderColor,
          stroke: { color: 0x000000, width: 1, alpha: 0.4 }
        })
      })
      badge.anchor.set(0.5)
      badge.x = CARD_WIDTH - 12
      badge.y = 10
      this.content.addChild(badge)
    }
  }

  private drawBack(): void {
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8).fill({ color: COLORS.cardBack })
    // 内层更深的暗色
    this.bg.roundRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6, 6).fill({ color: 0x271343, alpha: 0.6 })
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8).stroke({ width: 2, color: COLORS.cardBackEdge })
    this.bg.roundRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6, 6)
      .stroke({ width: 0.6, color: COLORS.cardBackWeb, alpha: 0.3 })

    const web = new Graphics()
    const cx = CARD_WIDTH / 2
    const cy = CARD_HEIGHT / 2

    // 角落 L 形装饰
    const corner = (ox: number, oy: number, sx: number, sy: number) => {
      web.moveTo(ox, oy + 14 * sy).lineTo(ox, oy).lineTo(ox + 14 * sx, oy)
        .stroke({ width: 1, color: COLORS.cardBackWeb, alpha: 0.5 })
    }
    corner(8, 8, 1, 1)
    corner(CARD_WIDTH - 8, 8, -1, 1)
    corner(8, CARD_HEIGHT - 8, 1, -1)
    corner(CARD_WIDTH - 8, CARD_HEIGHT - 8, -1, -1)

    // 同心蛛网
    web.circle(cx, cy, 8).stroke({ width: 1, color: COLORS.cardBackWeb, alpha: 0.65 })
    web.circle(cx, cy, 16).stroke({ width: 1, color: COLORS.cardBackWeb, alpha: 0.5 })
    web.circle(cx, cy, 26).stroke({ width: 0.8, color: COLORS.cardBackWeb, alpha: 0.38 })
    web.circle(cx, cy, 36).stroke({ width: 0.8, color: COLORS.cardBackWeb, alpha: 0.28 })

    // 辐条
    const spokes = 8
    for (let i = 0; i < spokes; i++) {
      const angle = (Math.PI * 2 * i) / spokes + Math.PI / 8
      const x2 = cx + Math.cos(angle) * 40
      const y2 = cy + Math.sin(angle) * 40
      web.moveTo(cx, cy).lineTo(x2, y2).stroke({ width: 0.8, color: COLORS.cardBackWeb, alpha: 0.55 })
    }

    // 中心的小蜘蛛剪影
    const spider = new Graphics()
    spider.circle(cx, cy, 4).fill({ color: 0x1a0f25 })
    spider.circle(cx, cy - 3, 2.2).fill({ color: 0x1a0f25 })
    // 腿
    for (let i = 0; i < 4; i++) {
      const baseA = Math.PI / 5 + i * 0.24
      const lx = Math.cos(baseA) * 3
      const ly = Math.sin(baseA) * 3
      const mx1 = Math.cos(baseA - 0.2) * 7
      const my1 = Math.sin(baseA - 0.2) * 7
      const ex1 = Math.cos(baseA) * 10
      const ey1 = Math.sin(baseA) * 10
      spider.moveTo(cx + lx, cy + ly).lineTo(cx + mx1, cy + my1).lineTo(cx + ex1, cy + ey1)
        .stroke({ width: 0.8, color: 0x1a0f25 })
      spider.moveTo(cx - lx, cy + ly).lineTo(cx - mx1, cy + my1).lineTo(cx - ex1, cy + ey1)
        .stroke({ width: 0.8, color: 0x1a0f25 })
    }

    this.content.addChild(web, spider)
  }

  async flipToFront(): Promise<void> {
    if (this.card.faceUp) {
      this.redraw()
      return
    }
    return new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to(this.inner.scale, { x: 0, duration: ANIM.CARD_FLIP * 0.45, ease: 'power2.in' })
        .call(() => {
          this.card.faceUp = true
          this.redraw()
        })
        .to(this.inner.scale, { x: 1, duration: ANIM.CARD_FLIP * 0.55, ease: 'back.out(2)' })
    })
  }

  /** 强制播放翻面动画，无视当前状态 */
  async playFlipFromBack(): Promise<void> {
    this.card.faceUp = false
    this.redraw()
    return new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to(this.inner.scale, { x: 0, duration: ANIM.CARD_FLIP * 0.45, ease: 'power2.in' })
        .call(() => {
          this.card.faceUp = true
          this.redraw()
        })
        .to(this.inner.scale, { x: 1, duration: ANIM.CARD_FLIP * 0.55, ease: 'back.out(2)' })
    })
  }

  async moveTo(x: number, y: number, duration: number = ANIM.CARD_MOVE): Promise<void> {
    this.homeX = x
    this.homeY = y
    return new Promise<void>((resolve) => {
      gsap.to(this, { x, y, duration, ease: 'power2.out', onComplete: () => resolve() })
    })
  }

  setHome(x: number, y: number, snap = true): void {
    this.homeX = x
    this.homeY = y
    if (snap) this.position.set(x, y)
  }

  snapBack(): void {
    gsap.to(this, { x: this.homeX, y: this.homeY, duration: 0.25, ease: 'back.out(2)' })
  }

  shake(): void {
    const x = this.homeX
    gsap.timeline()
      .to(this, { x: x - 6, duration: 0.05 })
      .to(this, { x: x + 6, duration: 0.05 })
      .to(this, { x: x - 4, duration: 0.05 })
      .to(this, { x, duration: 0.05 })
  }
}
