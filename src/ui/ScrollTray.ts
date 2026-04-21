import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import type { ScrollInstance } from '../game/Inventory'
import { COLORS, GAME_WIDTH, TRAY_HEIGHT, TRAY_Y } from '../config/constants'
import { t } from '../i18n/i18n'

const SLOT_W = 72
const SLOT_H = 58
const SLOT_GAP = 6

export class ScrollTray extends Container {
  private slots: Container[] = []
  private bg: Graphics
  private titleText: Text
  private capacity: number
  private activeUid: string | null = null
  private cached: ScrollInstance[] = []

  onScrollClick?: (uid: string) => void
  onHoverDescribe?: (text: string | null, x: number, y: number) => void

  constructor(capacity: number = 5) {
    super()
    this.capacity = capacity

    const barW = capacity * SLOT_W + (capacity - 1) * SLOT_GAP + 36
    this.bg = new Graphics()
    this.bg.roundRect(0, 0, barW, TRAY_HEIGHT, 10)
      .fill({ color: 0x14091f, alpha: 0.55 })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.4 })
    this.addChild(this.bg)

    this.titleText = new Text({
      text: t('tray.scrolls'),
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

    this.x = GAME_WIDTH - barW - 40
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

  setActive(uid: string | null): void {
    this.activeUid = uid
    for (const slot of this.slots) {
      const uidTag = (slot as Container & { _uid?: string })._uid
      if (uidTag && uidTag === uid) {
        gsap.to(slot.scale, { x: 1.12, y: 1.12, duration: 0.2 })
      } else {
        gsap.to(slot.scale, { x: 1, y: 1, duration: 0.2 })
      }
    }
  }

  update(scrolls: ScrollInstance[]): void {
    this.cached = scrolls
    for (let i = 0; i < this.capacity; i++) {
      const slot = this.slots[i]
      slot.removeChildren()
      ;(slot as Container & { _uid?: string })._uid = undefined
      const sc = scrolls[i]
      if (sc) {
        const isActive = sc.uid === this.activeUid
        const g = new Graphics()
        g.roundRect(0, 0, SLOT_W, SLOT_H, 8)
          .fill({ color: isActive ? 0x3a2a5e : 0x2a1a3e })
          .stroke({ width: isActive ? 3 : 2, color: sc.def.color })
        slot.addChild(g)

        const glyph = new Text({
          text: sc.def.glyph,
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 26,
            fill: sc.def.color
          })
        })
        glyph.anchor.set(0.5)
        glyph.x = SLOT_W / 2
        glyph.y = SLOT_H / 2 - 6
        slot.addChild(glyph)

        const localizedName = t(`scroll.${sc.def.id}.name`)
        const localizedDesc = t(`scroll.${sc.def.id}.desc`)

        const nameShort = localizedName.split(' ')[0]
        const name = new Text({
          text: nameShort,
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            fill: 0xffffff
          })
        })
        name.anchor.set(0.5)
        name.x = SLOT_W / 2
        name.y = SLOT_H - 8
        slot.addChild(name)

        ;(slot as Container & { _uid?: string })._uid = sc.uid

        slot.eventMode = 'static'
        slot.cursor = 'pointer'
        slot.on('pointerover', () => {
          gsap.to(slot.scale, { x: 1.08, y: 1.08, duration: 0.15 })
          const pos = slot.getGlobalPosition()
          this.onHoverDescribe?.(`${localizedName}\n${localizedDesc}`, pos.x + SLOT_W / 2, pos.y + SLOT_H + 8)
        })
        slot.on('pointerout', () => {
          if (sc.uid !== this.activeUid) {
            gsap.to(slot.scale, { x: 1, y: 1, duration: 0.15 })
          }
          this.onHoverDescribe?.(null, 0, 0)
        })
        slot.on('pointerdown', () => this.onScrollClick?.(sc.uid))
      } else {
        const g = new Graphics()
        g.roundRect(0, 0, SLOT_W, SLOT_H, 8)
          .fill({ color: 0x1a0f2a, alpha: 0.5 })
          .stroke({ width: 1, color: COLORS.accent, alpha: 0.25 })
        slot.addChild(g)
        slot.eventMode = 'none'
      }
    }
  }

  applyLang(): void {
    this.titleText.text = t('tray.scrolls')
    this.update(this.cached)
  }
}
