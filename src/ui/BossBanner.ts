import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_WIDTH } from '../config/constants'
import { t } from '../i18n/i18n'
import type { BossDef } from '../game/Boss'

export class BossBanner extends Container {
  private bg: Graphics
  private titleText: Text
  private subText: Text
  private nameText: Text

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'none'

    this.bg = new Graphics()
    this.bg.rect(0, 0, GAME_WIDTH, 220).fill({ color: 0x3a0514, alpha: 0 })
    this.addChild(this.bg)

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 56,
        fontWeight: 'bold',
        fill: 0xff5a5f,
        stroke: { color: 0x2a0010, width: 8 },
        letterSpacing: 6
      })
    })
    this.titleText.anchor.set(0.5)
    this.titleText.x = GAME_WIDTH / 2
    this.titleText.y = 66
    this.addChild(this.titleText)

    this.nameText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 40,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x2a0010, width: 6 },
        letterSpacing: 4
      })
    })
    this.nameText.anchor.set(0.5)
    this.nameText.x = GAME_WIDTH / 2
    this.nameText.y = 118
    this.addChild(this.nameText)

    this.subText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fill: 0xffd67a,
        letterSpacing: 2,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 160
      })
    })
    this.subText.anchor.set(0.5)
    this.subText.x = GAME_WIDTH / 2
    this.subText.y = 168
    this.addChild(this.subText)
  }

  async play(boss: BossDef | null = null): Promise<void> {
    this.visible = true
    this.titleText.text = t('boss.banner_title')
    if (boss) {
      this.nameText.text = t(`boss.${boss.id}.name`)
      this.subText.text = t(`boss.${boss.id}.desc`)
      this.nameText.style.fill = boss.color
    } else {
      this.nameText.text = ''
      this.subText.text = t('boss.banner_sub')
    }
    this.titleText.alpha = 0
    this.nameText.alpha = 0
    this.subText.alpha = 0
    this.titleText.scale.set(0.4)
    this.nameText.scale.set(0.7)
    this.bg.alpha = 0

    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to(this.bg, { alpha: 0.7, duration: 0.2 })
        .to(this.titleText, { alpha: 1, duration: 0.25 }, 0)
        .to(this.titleText.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2)' }, 0)
        .to(this.nameText, { alpha: 1, duration: 0.3 }, 0.15)
        .to(this.nameText.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2.5)' }, 0.15)
        .to(this.subText, { alpha: 1, duration: 0.3 }, 0.35)
        .to({}, { duration: 1.2 })
        .to([this.titleText, this.nameText, this.subText], { alpha: 0, duration: 0.3 })
        .to(this.bg, { alpha: 0, duration: 0.3 }, '<')
    })
    this.visible = false
  }
}
