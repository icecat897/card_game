import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS } from '../config/constants'
import { t } from '../i18n/i18n'

export class CashOutButton extends Container {
  private bg: Graphics
  private labelText: Text
  private rewardText: Text
  private pulseTween?: gsap.core.Tween
  onClick?: () => void

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const w = 200
    const h = 92
    this.bg = new Graphics()
    this.bg.roundRect(0, 0, w, h, 14)
      .fill({ color: COLORS.gold })
      .stroke({ width: 3, color: 0xffffff, alpha: 0.7 })
    this.addChild(this.bg)

    this.labelText = new Text({
      text: t('cash_out'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0x2a1a00,
        letterSpacing: 3
      })
    })
    this.labelText.anchor.set(0.5)
    this.labelText.x = w / 2
    this.labelText.y = 26
    this.addChild(this.labelText)

    this.rewardText = new Text({
      text: '+$10',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 30,
        fontWeight: 'bold',
        fill: 0x2a1a00
      })
    })
    this.rewardText.anchor.set(0.5)
    this.rewardText.x = w / 2
    this.rewardText.y = 62
    this.addChild(this.rewardText)

    this.on('pointerover', () => gsap.to(this.scale, { x: 1.08, y: 1.08, duration: 0.15 }))
    this.on('pointerout', () => gsap.to(this.scale, { x: 1, y: 1, duration: 0.15 }))
    this.on('pointerdown', () => this.onClick?.())
  }

  setReward(n: number): void {
    this.rewardText.text = `+$${n}`
  }

  show(): void {
    if (this.visible) return
    this.visible = true
    this.scale.set(0)
    gsap.to(this.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2)' })
    this.startPulse()
  }

  hide(): void {
    if (!this.visible) return
    this.pulseTween?.kill()
    gsap.to(this.scale, {
      x: 0,
      y: 0,
      duration: 0.2,
      onComplete: () => { this.visible = false }
    })
  }

  private startPulse(): void {
    this.pulseTween?.kill()
    this.bg.alpha = 1
    this.pulseTween = gsap.to(this.bg, {
      alpha: 0.65,
      duration: 0.75,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }

  applyLang(): void {
    this.labelText.text = t('cash_out')
  }
}
