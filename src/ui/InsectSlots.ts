import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import type { InsectInstance } from '../game/Inventory'
import { COLORS, TRAY_HEIGHT, TRAY_Y } from '../config/constants'
import { t } from '../i18n/i18n'

const SLOT_W = 90
const SLOT_H = 62
const SLOT_GAP = 8
const TRAY_PADDING_X = 40

export class InsectSlots extends Container {
  private slots: Container[] = []
  private bg: Graphics
  private titleText: Text
  private capacity: number
  private cached: InsectInstance[] = []
  onHoverDescribe?: (text: string | null, x: number, y: number) => void

  constructor(capacity: number = 3) {
    super()
    this.capacity = capacity

    const barW = capacity * SLOT_W + (capacity - 1) * SLOT_GAP + 36
    this.bg = new Graphics()
    this.bg.roundRect(0, 0, barW, TRAY_HEIGHT, 10)
      .fill({ color: 0x14091f, alpha: 0.55 })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.4 })
    this.addChild(this.bg)

    this.titleText = new Text({
      text: t('tray.insects'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        fill: COLORS.textDim,
        letterSpacing: 2
      })
    })
    this.titleText.x = 14
    this.titleText.y = 4
    this.addChild(this.titleText)

    for (let i = 0; i < capacity; i++) {
      const slot = this.createEmptySlot()
      slot.x = 18 + i * (SLOT_W + SLOT_GAP)
      slot.y = (TRAY_HEIGHT - SLOT_H) / 2 + 6
      this.addChild(slot)
      this.slots.push(slot)
    }

    this.x = TRAY_PADDING_X
    this.y = TRAY_Y
  }

  private createEmptySlot(): Container {
    const c = new Container()
    const g = new Graphics()
    g.roundRect(0, 0, SLOT_W, SLOT_H, 8)
      .fill({ color: 0x1a0f2a, alpha: 0.5 })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.25 })
    c.addChild(g)
    return c
  }

  update(insects: InsectInstance[]): void {
    this.cached = insects
    for (let i = 0; i < this.capacity; i++) {
      const slot = this.slots[i]
      slot.removeChildren()
      const ins = insects[i]
      if (ins) {
        const g = new Graphics()
        g.roundRect(0, 0, SLOT_W, SLOT_H, 8)
          .fill({ color: 0x2a1a3e })
          .stroke({ width: 2, color: ins.def.color })
        slot.addChild(g)

        const glyph = new Text({
          text: ins.def.glyph,
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 28,
            fontWeight: 'bold',
            fill: ins.def.color
          })
        })
        glyph.anchor.set(0.5)
        glyph.x = 20
        glyph.y = SLOT_H / 2
        slot.addChild(glyph)

        const localizedName = t(`insect.${ins.def.id}.name`)
        const localizedDesc = t(`insect.${ins.def.id}.desc`)

        const name = new Text({
          text: localizedName,
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            fontWeight: 'bold',
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: SLOT_W - 44
          })
        })
        name.x = 40
        name.y = 8
        slot.addChild(name)

        const rarity = new Text({
          text: '\u2605'.repeat(ins.def.rarity),
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            fill: COLORS.gold
          })
        })
        rarity.x = 40
        rarity.y = SLOT_H - 18
        slot.addChild(rarity)

        slot.eventMode = 'static'
        slot.cursor = 'help'
        slot.on('pointerover', () => {
          gsap.to(slot.scale, { x: 1.05, y: 1.05, duration: 0.15 })
          const pos = slot.getGlobalPosition()
          this.onHoverDescribe?.(`${localizedName}\n${localizedDesc}`, pos.x + SLOT_W / 2, pos.y + SLOT_H + 8)
        })
        slot.on('pointerout', () => {
          gsap.to(slot.scale, { x: 1, y: 1, duration: 0.15 })
          this.onHoverDescribe?.(null, 0, 0)
        })
      } else {
        const g = new Graphics()
        g.roundRect(0, 0, SLOT_W, SLOT_H, 8)
          .fill({ color: 0x1a0f2a, alpha: 0.5 })
          .stroke({ width: 1, color: COLORS.accent, alpha: 0.25 })
        slot.addChild(g)
        const plus = new Text({
          text: '+',
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fill: COLORS.accent
          })
        })
        plus.alpha = 0.4
        plus.anchor.set(0.5)
        plus.x = SLOT_W / 2
        plus.y = SLOT_H / 2
        slot.addChild(plus)
        slot.eventMode = 'none'
      }
    }
  }

  applyLang(): void {
    this.titleText.text = t('tray.insects')
    this.update(this.cached)
  }
}
