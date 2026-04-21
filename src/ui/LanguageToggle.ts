import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS } from '../config/constants'
import { lang, setLang, onLangChange } from '../i18n/i18n'

export class LanguageToggle extends Container {
  private labelText: Text

  constructor() {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const w = 56
    const h = 40
    const bg = new Graphics()
    bg.roundRect(0, 0, w, h, 10)
      .fill({ color: 0x1a0f2e, alpha: 0.85 })
      .stroke({ width: 2, color: COLORS.accent })
    this.addChild(bg)

    this.labelText = new Text({
      text: this.currentLabel(),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: COLORS.gold
      })
    })
    this.labelText.anchor.set(0.5)
    this.labelText.x = w / 2
    this.labelText.y = h / 2
    this.addChild(this.labelText)

    this.on('pointerover', () => gsap.to(this.scale, { x: 1.08, y: 1.08, duration: 0.15 }))
    this.on('pointerout', () => gsap.to(this.scale, { x: 1, y: 1, duration: 0.15 }))
    this.on('pointerdown', () => {
      setLang(lang() === 'zh' ? 'en' : 'zh')
    })

    onLangChange(() => {
      this.labelText.text = this.currentLabel()
    })
  }

  private currentLabel(): string {
    return lang() === 'zh' ? '中 / EN' : 'EN / 中'
  }
}
