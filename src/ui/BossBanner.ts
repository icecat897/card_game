import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_WIDTH } from '../config/constants'
import { t } from '../i18n/i18n'

export class BossBanner extends Container {
  private bg: Graphics
  private titleText: Text
  private subText: Text

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'none'

    this.bg = new Graphics()
    this.bg.rect(0, 0, GAME_WIDTH, 160).fill({ color: 0x3a0514, alpha: 0 })
    this.addChild(this.bg)

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 72,
        fontWeight: 'bold',
        fill: 0xff5a5f,
        stroke: { color: 0x2a0010, width: 8 },
        letterSpacing: 8
      })
    })
    this.titleText.anchor.set(0.5)
    this.titleText.x = GAME_WIDTH / 2
    this.titleText.y = 80
    this.addChild(this.titleText)

    this.subText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fill: 0xffd67a,
        letterSpacing: 4
      })
    })
    this.subText.anchor.set(0.5)
    this.subText.x = GAME_WIDTH / 2
    this.subText.y = 128
    this.addChild(this.subText)
  }

  async play(): Promise<void> {
    this.visible = true
    this.titleText.text = t('boss.banner_title')
    this.subText.text = t('boss.banner_sub')
    this.titleText.alpha = 0
    this.subText.alpha = 0
    this.titleText.scale.set(0.4)
    this.bg.alpha = 0

    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to(this.bg, { alpha: 0.7, duration: 0.2 })
        .to(this.titleText, { alpha: 1, duration: 0.25 }, 0)
        .to(this.titleText.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2)' }, 0)
        .to(this.subText, { alpha: 1, duration: 0.3 }, 0.2)
        .to({}, { duration: 1.0 })
        .to([this.titleText, this.subText], { alpha: 0, duration: 0.3 })
        .to(this.bg, { alpha: 0, duration: 0.3 }, '<')
    })
    this.visible = false
  }
}
