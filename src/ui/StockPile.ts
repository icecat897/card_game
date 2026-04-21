import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { CARD_WIDTH, CARD_HEIGHT, COLORS } from '../config/constants'
import { t } from '../i18n/i18n'

export class StockPile extends Container {
  private countText: Text
  private labelText: Text
  private glow: Graphics
  private available: boolean = true
  private warningTween?: gsap.core.Tween

  onDeal?: () => void

  constructor() {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.glow = new Graphics()
    this.glow.roundRect(-6, -6, CARD_WIDTH + 12, CARD_HEIGHT + 12, 12)
      .fill({ color: COLORS.gold, alpha: 0 })
    this.addChild(this.glow)

    for (let i = 2; i >= 0; i--) {
      const g = new Graphics()
      g.roundRect(i * 2, -i * 2, CARD_WIDTH, CARD_HEIGHT, 8)
        .fill({ color: COLORS.cardBack })
        .stroke({ width: 2, color: COLORS.cardBackEdge })
      const cx = i * 2 + CARD_WIDTH / 2
      const cy = -i * 2 + CARD_HEIGHT / 2
      g.circle(cx, cy, 14).stroke({ width: 1, color: COLORS.cardBackWeb, alpha: 0.4 })
      g.circle(cx, cy, 24).stroke({ width: 1, color: COLORS.cardBackWeb, alpha: 0.3 })
      for (let r = 0; r < 8; r++) {
        const ang = (Math.PI * 2 * r) / 8
        g.moveTo(cx, cy).lineTo(cx + Math.cos(ang) * 28, cy + Math.sin(ang) * 28)
          .stroke({ width: 1, color: COLORS.cardBackWeb, alpha: 0.45 })
      }
      this.addChild(g)
    }

    this.labelText = new Text({
      text: t('deal'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fill: COLORS.gold,
        letterSpacing: 3,
        fontWeight: 'bold'
      })
    })
    this.labelText.anchor.set(0.5)
    this.labelText.x = CARD_WIDTH / 2
    this.labelText.y = CARD_HEIGHT + 16
    this.addChild(this.labelText)

    this.countText = new Text({
      text: '\u00d75',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 'bold'
      })
    })
    this.countText.anchor.set(0.5)
    this.countText.x = CARD_WIDTH / 2
    this.countText.y = CARD_HEIGHT + 40
    this.addChild(this.countText)

    this.on('pointerover', () => {
      if (this.available) gsap.to(this.scale, { x: 1.06, y: 1.06, duration: 0.15 })
    })
    this.on('pointerout', () => {
      gsap.to(this.scale, { x: 1, y: 1, duration: 0.15 })
    })
    this.on('pointerdown', () => {
      if (!this.available) return
      this.onDeal?.()
    })
  }

  setRoundsLeft(n: number): void {
    this.countText.text = `\u00d7${n}`
    this.available = n > 0
    this.alpha = n > 0 ? 1 : 0.35
    this.cursor = n > 0 ? 'pointer' : 'default'
  }

  setDeckable(ok: boolean): void {
    if (!ok && this.available) {
      this.alpha = 0.5
      this.cursor = 'default'
    } else if (this.available) {
      this.alpha = 1
      this.cursor = 'pointer'
    }
  }

  showWarning(on: boolean): void {
    this.warningTween?.kill()
    if (on) {
      this.warningTween = gsap.to(this.glow, {
        alpha: 0.5,
        duration: 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          this.glow.clear()
          this.glow.roundRect(-6, -6, CARD_WIDTH + 12, CARD_HEIGHT + 12, 12)
            .fill({ color: COLORS.danger, alpha: this.glow.alpha })
        }
      })
    } else {
      this.glow.clear()
      this.glow.alpha = 0
    }
  }

  pulseReject(): void {
    const origX = this.x
    gsap.timeline()
      .to(this, { x: origX - 8, duration: 0.05 })
      .to(this, { x: origX + 8, duration: 0.05 })
      .to(this, { x: origX - 4, duration: 0.05 })
      .to(this, { x: origX, duration: 0.05 })
  }

  applyLang(): void {
    this.labelText.text = t('deal')
  }
}
