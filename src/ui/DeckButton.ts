import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS } from '../config/constants'
import { t } from '../i18n/i18n'

export class DeckButton extends Container {
  onClick?: () => void
  onHoverDescribe?: (text: string | null, x: number, y: number) => void

  constructor() {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const bg = new Graphics()
    bg.circle(24, 24, 20)
      .fill({ color: 0x1a0f2e, alpha: 0.85 })
      .stroke({ width: 2, color: COLORS.accent })
    this.addChild(bg)

    // 叠放的三张小卡的图标
    const icon = new Graphics()
    icon.roundRect(17, 13, 14, 18, 2)
      .fill({ color: COLORS.cardFront, alpha: 0.55 })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.7 })
    icon.roundRect(19, 16, 14, 18, 2)
      .fill({ color: COLORS.cardFront, alpha: 0.75 })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.85 })
    icon.roundRect(21, 19, 14, 18, 2)
      .fill({ color: COLORS.cardFront })
      .stroke({ width: 1.2, color: COLORS.gold })
    this.addChild(icon)

    const glyph = new Text({
      text: '\u2660',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0x1a1625
      })
    })
    glyph.anchor.set(0.5)
    glyph.x = 28
    glyph.y = 28
    this.addChild(glyph)

    this.on('pointerover', () => {
      gsap.to(this.scale, { x: 1.1, y: 1.1, duration: 0.15 })
      const pos = this.getGlobalPosition()
      this.onHoverDescribe?.(t('deckbutton.label'), pos.x + 24, pos.y + 52)
    })
    this.on('pointerout', () => {
      gsap.to(this.scale, { x: 1, y: 1, duration: 0.15 })
      this.onHoverDescribe?.(null, 0, 0)
    })
    this.on('pointerdown', () => this.onClick?.())
  }
}
