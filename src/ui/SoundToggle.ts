import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS } from '../config/constants'
import { sound } from '../fx/SoundEngine'

/**
 * 点击循环 ♪ (全开) → ♪ (仅 SFX) → 🔇 (全静音) → ♪ (全开)
 * 使用文字图标，避免外部素材。
 */
export class SoundToggle extends Container {
  private iconText: Text
  private bg: Graphics
  private state: 'all' | 'sfx_only' | 'muted' = 'all'

  constructor() {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const w = 40
    const h = 40
    this.bg = new Graphics()
    this.redrawBg(w, h)
    this.addChild(this.bg)

    this.iconText = new Text({
      text: '\u266A',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fontWeight: 'bold',
        fill: COLORS.gold
      })
    })
    this.iconText.anchor.set(0.5)
    this.iconText.x = w / 2
    this.iconText.y = h / 2
    this.addChild(this.iconText)

    this.on('pointerover', () => gsap.to(this.scale, { x: 1.1, y: 1.1, duration: 0.15 }))
    this.on('pointerout', () => gsap.to(this.scale, { x: 1, y: 1, duration: 0.15 }))
    this.on('pointerdown', () => this.cycle())
  }

  private redrawBg(w: number, h: number): void {
    this.bg.clear()
    this.bg.roundRect(0, 0, w, h, 10)
      .fill({ color: 0x1a0f2e, alpha: 0.85 })
      .stroke({ width: 2, color: COLORS.accent })
  }

  private cycle(): void {
    if (this.state === 'all') {
      this.state = 'sfx_only'
      sound.setMusicMuted(true)
      sound.setMuted(false)
      this.iconText.text = '\u266A'
      this.iconText.style.fill = COLORS.textDim
    } else if (this.state === 'sfx_only') {
      this.state = 'muted'
      sound.setMusicMuted(true)
      sound.setMuted(true)
      this.iconText.text = '\u2205'
      this.iconText.style.fill = COLORS.danger
    } else {
      this.state = 'all'
      sound.setMusicMuted(false)
      sound.setMuted(false)
      this.iconText.text = '\u266A'
      this.iconText.style.fill = COLORS.gold
    }
    gsap.fromTo(this.iconText.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' })
  }
}
