import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants'
import { CHARACTERS, type CharacterDef, type CharacterId } from '../game/Character'
import { t } from '../i18n/i18n'

const CARD_W = 230
const CARD_H = 300
const GAP = 24

export class CharacterSelect extends Container {
  private dim: Graphics
  private panel: Container
  private titleText: Text
  private cardContainers: Container[] = []
  onPick?: (id: CharacterId) => void

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'static'

    this.dim = new Graphics()
    this.dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.85 })
    this.dim.eventMode = 'static'
    this.addChild(this.dim)

    this.panel = new Container()
    const defs = Object.values(CHARACTERS)
    const panelW = defs.length * CARD_W + (defs.length - 1) * GAP + 80
    const panelH = CARD_H + 180
    this.panel.x = (GAME_WIDTH - panelW) / 2
    this.panel.y = (GAME_HEIGHT - panelH) / 2
    const bg = new Graphics()
    bg.roundRect(0, 0, panelW, panelH, 20)
      .fill({ color: 0x1a0f2e })
      .stroke({ width: 3, color: COLORS.accent })
    this.panel.addChild(bg)
    this.addChild(this.panel)

    this.titleText = new Text({
      text: t('char.select_title'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 32,
        fontWeight: 'bold',
        fill: COLORS.gold,
        letterSpacing: 6
      })
    })
    this.titleText.anchor.set(0.5, 0)
    this.titleText.x = panelW / 2
    this.titleText.y = 24
    this.panel.addChild(this.titleText)

    const subtitle = new Text({
      text: t('char.select_sub'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fill: 0xcbbfe0,
        letterSpacing: 2
      })
    })
    subtitle.anchor.set(0.5, 0)
    subtitle.x = panelW / 2
    subtitle.y = 66
    this.panel.addChild(subtitle)

    for (let i = 0; i < defs.length; i++) {
      const card = this.makeCharacterCard(defs[i])
      card.x = 40 + i * (CARD_W + GAP)
      card.y = 110
      this.panel.addChild(card)
      this.cardContainers.push(card)
    }
  }

  private makeCharacterCard(def: CharacterDef): Container {
    const c = new Container()
    c.eventMode = 'static'
    c.cursor = 'pointer'

    const bg = new Graphics()
    bg.roundRect(0, 0, CARD_W, CARD_H, 14)
      .fill({ color: 0x2a1a3e })
      .stroke({ width: 2, color: def.color })
    c.addChild(bg)

    // 头像：大的玻璃质感圆圈 + glyph
    const avatarBg = new Graphics()
    avatarBg.circle(CARD_W / 2, 78, 46)
      .fill({ color: 0x0a0612 })
      .stroke({ width: 3, color: def.color })
    c.addChild(avatarBg)

    const glyph = new Text({
      text: def.glyph,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 58,
        fontWeight: 'bold',
        fill: def.color
      })
    })
    glyph.anchor.set(0.5)
    glyph.x = CARD_W / 2
    glyph.y = 78
    c.addChild(glyph)

    const name = new Text({
      text: t(`char.${def.id}.name`),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 3
      })
    })
    name.anchor.set(0.5)
    name.x = CARD_W / 2
    name.y = 150
    c.addChild(name)

    const desc = new Text({
      text: t(`char.${def.id}.desc`),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        fill: 0xcbbfe0,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_W - 24,
        lineHeight: 17
      })
    })
    desc.anchor.set(0.5, 0)
    desc.x = CARD_W / 2
    desc.y = 178
    c.addChild(desc)

    const btnBg = new Graphics()
    btnBg.roundRect(30, CARD_H - 50, CARD_W - 60, 34, 8)
      .fill({ color: def.color })
    c.addChild(btnBg)

    const btnLabel = new Text({
      text: t('char.play'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0x1a0f2e,
        letterSpacing: 3
      })
    })
    btnLabel.anchor.set(0.5)
    btnLabel.x = CARD_W / 2
    btnLabel.y = CARD_H - 33
    c.addChild(btnLabel)

    c.on('pointerover', () => gsap.to(c.scale, { x: 1.05, y: 1.05, duration: 0.15 }))
    c.on('pointerout', () => gsap.to(c.scale, { x: 1, y: 1, duration: 0.15 }))
    c.on('pointerdown', () => this.onPick?.(def.id))

    return c
  }

  show(): void {
    this.visible = true
    this.dim.alpha = 0
    this.panel.scale.set(0.85)
    this.panel.alpha = 0
    gsap.to(this.dim, { alpha: 0.85, duration: 0.3 })
    gsap.to(this.panel.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2)' })
    gsap.to(this.panel, { alpha: 1, duration: 0.3 })
  }

  async hide(): Promise<void> {
    return new Promise<void>((resolve) => {
      gsap.to(this.dim, { alpha: 0, duration: 0.2 })
      gsap.to(this.panel, {
        alpha: 0,
        duration: 0.2,
        onComplete: () => {
          this.visible = false
          resolve()
        }
      })
    })
  }

  applyLang(): void {
    this.titleText.text = t('char.select_title')
    // 重绘所有卡，最简单的方式是 destroy 重建，但此处文本嵌入较深，为避免复杂化，直接重新构造
    for (const c of this.cardContainers) this.panel.removeChild(c)
    this.cardContainers = []
    const defs = Object.values(CHARACTERS)
    for (let i = 0; i < defs.length; i++) {
      const card = this.makeCharacterCard(defs[i])
      card.x = 40 + i * (CARD_W + GAP)
      card.y = 110
      this.panel.addChild(card)
      this.cardContainers.push(card)
    }
  }
}
