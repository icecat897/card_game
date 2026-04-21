import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS } from '../config/constants'

export class SettingsButton extends Container {
  onClick?: () => void

  constructor() {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const bg = new Graphics()
    bg.circle(24, 24, 20)
      .fill({ color: 0x1a0f2e, alpha: 0.85 })
      .stroke({ width: 2, color: COLORS.accent })
    this.addChild(bg)

    const icon = new Text({
      text: '?',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fontWeight: 'bold',
        fill: COLORS.gold
      })
    })
    icon.anchor.set(0.5)
    icon.x = 24
    icon.y = 24
    this.addChild(icon)

    this.on('pointerover', () => gsap.to(this.scale, { x: 1.1, y: 1.1, duration: 0.15 }))
    this.on('pointerout', () => gsap.to(this.scale, { x: 1, y: 1, duration: 0.15 }))
    this.on('pointerdown', () => this.onClick?.())
  }
}
