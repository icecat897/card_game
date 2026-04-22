import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import type { InsectInstance } from '../game/Inventory'
import { COLORS, TRAY_HEIGHT, TRAY_Y } from '../config/constants'
import { t } from '../i18n/i18n'

const SLOT_W = 70
const SLOT_H = 62
const SLOT_GAP = 6
const FOUNDATION_W = 58
const FOUNDATION_GAP = 10
const TRAY_PADDING_X = 40

interface SlotContainer extends Container {
  _uid?: string
  _role?: 'regular' | 'foundation'
  _sellBtn?: Container
}

export class InsectSlots extends Container {
  private regularSlots: SlotContainer[] = []
  private foundationSlot!: SlotContainer
  private bg: Graphics
  private titleText: Text
  private foundationLabel: Text
  private capacity: number
  private cached: InsectInstance[] = []
  private cachedFoundation: InsectInstance | null = null
  onHoverDescribe?: (text: string | null, x: number, y: number) => void
  onSellInsect?: (uid: string) => void

  constructor(capacity: number = 5) {
    super()
    this.capacity = capacity

    const barW =
      FOUNDATION_W + FOUNDATION_GAP +
      capacity * SLOT_W + (capacity - 1) * SLOT_GAP + 36
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
    this.titleText.x = 14 + FOUNDATION_W + FOUNDATION_GAP
    this.titleText.y = 4
    this.addChild(this.titleText)

    this.foundationLabel = new Text({
      text: t('tray.foundation'),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 9,
        fill: 0xe6a87a,
        letterSpacing: 2
      })
    })
    this.foundationLabel.x = 18
    this.foundationLabel.y = 4
    this.addChild(this.foundationLabel)

    // Foundation 槽（宽度较窄，颜色暖）
    this.foundationSlot = new Container() as SlotContainer
    this.foundationSlot._role = 'foundation'
    this.foundationSlot.x = 18
    this.foundationSlot.y = (TRAY_HEIGHT - SLOT_H) / 2 + 6
    this.redrawFoundationEmpty()
    this.addChild(this.foundationSlot)

    // 普通槽
    for (let i = 0; i < capacity; i++) {
      const slot = new Container() as SlotContainer
      slot._role = 'regular'
      slot.x = 18 + FOUNDATION_W + FOUNDATION_GAP + i * (SLOT_W + SLOT_GAP)
      slot.y = (TRAY_HEIGHT - SLOT_H) / 2 + 6
      this.drawEmptyRegular(slot)
      this.addChild(slot)
      this.regularSlots.push(slot)
    }

    this.x = TRAY_PADDING_X
    this.y = TRAY_Y
  }

  private drawEmptyRegular(slot: SlotContainer): void {
    slot.removeChildren()
    slot._uid = undefined
    slot._sellBtn = undefined
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

  private redrawFoundationEmpty(): void {
    const slot = this.foundationSlot
    slot.removeChildren()
    slot._uid = undefined
    slot._sellBtn = undefined
    const g = new Graphics()
    g.roundRect(0, 0, FOUNDATION_W, SLOT_H, 8)
      .fill({ color: 0x1a0f1f, alpha: 0.5 })
      .stroke({ width: 1, color: 0x8a5a3a, alpha: 0.35 })
    slot.addChild(g)
    const mark = new Text({
      text: '\u2699',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fill: 0x8a5a3a,
        fontWeight: 'bold'
      })
    })
    mark.alpha = 0.45
    mark.anchor.set(0.5)
    mark.x = FOUNDATION_W / 2
    mark.y = SLOT_H / 2
    slot.addChild(mark)
    slot.eventMode = 'none'
  }

  private renderFilled(slot: SlotContainer, ins: InsectInstance, width: number, isFoundation: boolean): void {
    slot.removeChildren()
    slot._uid = ins.uid

    const ring = isFoundation ? 0xe6a87a : ins.def.color
    const bgColor = isFoundation ? 0x2a1a12 : 0x2a1a3e
    const g = new Graphics()
    g.roundRect(0, 0, width, SLOT_H, 8).fill({ color: bgColor }).stroke({ width: 2, color: ring })
    slot.addChild(g)

    // 昆虫字符
    const glyphSize = isFoundation ? 24 : 26
    const glyph = new Text({
      text: ins.def.glyph,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: glyphSize,
        fontWeight: 'bold',
        fill: ins.def.color
      })
    })
    glyph.anchor.set(0.5)
    glyph.x = isFoundation ? width / 2 : 20
    glyph.y = isFoundation ? SLOT_H / 2 - 4 : SLOT_H / 2
    slot.addChild(glyph)

    const localizedName = t(`insect.${ins.def.id}.name`)
    const localizedDesc = t(`insect.${ins.def.id}.desc`)

    if (!isFoundation) {
      const name = new Text({
        text: localizedName,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 10,
          fontWeight: 'bold',
          fill: 0xffffff,
          wordWrap: true,
          wordWrapWidth: width - 40
        })
      })
      name.x = 40
      name.y = 8
      slot.addChild(name)

      const rarity = new Text({
        text: '\u2605'.repeat(ins.def.rarity),
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 9,
          fill: COLORS.gold
        })
      })
      rarity.x = 40
      rarity.y = SLOT_H - 16
      slot.addChild(rarity)
    } else {
      const tag = new Text({
        text: t('insect_short.foundation'),
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: 8,
          fill: 0xffd6a8,
          letterSpacing: 1
        })
      })
      tag.anchor.set(0.5, 1)
      tag.x = width / 2
      tag.y = SLOT_H - 4
      slot.addChild(tag)
    }

    // Sell 按钮（默认隐藏）
    const sellBtn = new Container() as Container & { priceLabel: Text }
    sellBtn.eventMode = 'static'
    sellBtn.cursor = 'pointer'
    sellBtn.visible = false
    const sellBg = new Graphics()
    sellBg.roundRect(0, 0, Math.max(36, width - 8), 14, 4)
      .fill({ color: 0xd94a4a, alpha: 0.95 })
      .stroke({ width: 1, color: 0xffaaaa, alpha: 0.7 })
    sellBtn.addChild(sellBg)
    const priceLabel = new Text({
      text: `${t('sell')} $${ins.sellPrice}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 9,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 1
      })
    })
    priceLabel.anchor.set(0.5)
    priceLabel.x = Math.max(36, width - 8) / 2
    priceLabel.y = 7
    sellBtn.addChild(priceLabel)
    ;(sellBtn as Container & { priceLabel: Text }).priceLabel = priceLabel
    sellBtn.x = 4
    sellBtn.y = -4
    sellBtn.on('pointerdown', (e) => {
      e.stopPropagation()
      this.onSellInsect?.(ins.uid)
    })
    slot.addChild(sellBtn)
    slot._sellBtn = sellBtn

    // Hover 交互
    slot.eventMode = 'static'
    slot.cursor = 'help'
    slot.on('pointerover', () => {
      gsap.to(slot.scale, { x: 1.05, y: 1.05, duration: 0.15 })
      sellBtn.visible = true
      gsap.fromTo(sellBtn.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2.2)' })
      const pos = slot.getGlobalPosition()
      this.onHoverDescribe?.(
        `${localizedName}\n${localizedDesc}`,
        pos.x + width / 2,
        pos.y + SLOT_H + 8
      )
    })
    slot.on('pointerout', () => {
      gsap.to(slot.scale, { x: 1, y: 1, duration: 0.15 })
      sellBtn.visible = false
      this.onHoverDescribe?.(null, 0, 0)
    })
  }

  update(insects: InsectInstance[], foundation: InsectInstance | null = null): void {
    this.cached = insects
    this.cachedFoundation = foundation

    // foundation
    if (foundation) {
      this.renderFilled(this.foundationSlot, foundation, FOUNDATION_W, true)
    } else {
      this.redrawFoundationEmpty()
    }

    // regular
    for (let i = 0; i < this.capacity; i++) {
      const slot = this.regularSlots[i]
      const ins = insects[i]
      if (ins) {
        this.renderFilled(slot, ins, SLOT_W, false)
      } else {
        this.drawEmptyRegular(slot)
      }
    }
  }

  applyLang(): void {
    this.titleText.text = t('tray.insects')
    this.foundationLabel.text = t('tray.foundation')
    this.update(this.cached, this.cachedFoundation)
  }
}
