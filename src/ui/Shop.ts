import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants'
import type { InsectCardDef } from '../game/InsectCard'
import { INSECT_CARDS } from '../game/InsectCard'
import type { ScrollDef } from '../game/Scroll'
import { SCROLLS } from '../game/Scroll'
import type { PotionDef } from '../game/Potion'
import { POTIONS } from '../game/Potion'
import { t } from '../i18n/i18n'

export interface ShopItem {
  kind: 'insect' | 'scroll' | 'potion'
  insectDef?: InsectCardDef
  scrollDef?: ScrollDef
  potionDef?: PotionDef
  price: number
  purchased?: boolean
}

export interface RewardInfo {
  round: number
  total: number
  base: number
  clears: number
  steps: number
  interest: number
}

const REROLL_COST = 3
const ITEM_W = 160
const ITEM_H = 220
const ITEMS_PER_ROW = 5

export class Shop extends Container {
  private dim: Graphics
  private panel: Container
  private titleText: Text
  private coinText: Text
  private rewardText: Text
  private rerollBtnLabel: Text
  private nextBtnLabel: Text
  private itemContainer: Container
  private items: ShopItem[] = []
  private rewardInfo: RewardInfo | null = null

  private coins: number = 0
  onBuy?: (item: ShopItem) => boolean
  onReroll?: () => void
  onNext?: () => void

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'static'

    this.dim = new Graphics()
    this.dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.82 })
    this.dim.eventMode = 'static'
    this.addChild(this.dim)

    this.panel = new Container()
    const panelW = 960
    const panelH = 520
    this.panel.x = (GAME_WIDTH - panelW) / 2
    this.panel.y = (GAME_HEIGHT - panelH) / 2
    const bg = new Graphics()
    bg.roundRect(0, 0, panelW, panelH, 18)
      .fill({ color: 0x1a0f2e })
      .stroke({ width: 3, color: COLORS.accent })
    this.panel.addChild(bg)
    this.addChild(this.panel)

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 30,
        fontWeight: 'bold',
        fill: COLORS.gold,
        letterSpacing: 4
      })
    })
    this.titleText.anchor.set(0.5, 0)
    this.titleText.x = panelW / 2
    this.titleText.y = 24
    this.panel.addChild(this.titleText)

    this.rewardText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        fill: 0xffe07a,
        wordWrap: true,
        wordWrapWidth: panelW - 80,
        align: 'center'
      })
    })
    this.rewardText.anchor.set(0.5, 0)
    this.rewardText.x = panelW / 2
    this.rewardText.y = 62
    this.panel.addChild(this.rewardText)

    this.coinText = new Text({
      text: '$0',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        fontWeight: 'bold',
        fill: COLORS.gold
      })
    })
    this.coinText.x = 30
    this.coinText.y = 30
    this.panel.addChild(this.coinText)

    this.itemContainer = new Container()
    this.itemContainer.x = 30
    this.itemContainer.y = 110
    this.panel.addChild(this.itemContainer)

    const rerollBtn = this.makeButton(160, 42, COLORS.accent)
    this.rerollBtnLabel = rerollBtn.label
    rerollBtn.container.x = 30
    rerollBtn.container.y = panelH - 60
    rerollBtn.container.on('pointerdown', () => this.onReroll?.())
    this.panel.addChild(rerollBtn.container)

    const nextBtn = this.makeButton(220, 56, COLORS.gold, 0x2a1a00)
    this.nextBtnLabel = nextBtn.label
    nextBtn.container.x = panelW - 220 - 30
    nextBtn.container.y = panelH - 68
    nextBtn.container.on('pointerdown', () => this.onNext?.())
    this.panel.addChild(nextBtn.container)

    this.applyLang()
  }

  private makeButton(w: number, h: number, bgColor: number, textColor: number = 0xffffff): { container: Container; label: Text } {
    const c = new Container()
    c.eventMode = 'static'
    c.cursor = 'pointer'
    const g = new Graphics()
    g.roundRect(0, 0, w, h, 10)
      .fill({ color: bgColor })
      .stroke({ width: 2, color: 0xffffff, alpha: 0.3 })
    c.addChild(g)
    const label = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: textColor,
        letterSpacing: 2
      })
    })
    label.anchor.set(0.5)
    label.x = w / 2
    label.y = h / 2
    c.addChild(label)
    c.on('pointerover', () => gsap.to(c.scale, { x: 1.05, y: 1.05, duration: 0.15 }))
    c.on('pointerout', () => gsap.to(c.scale, { x: 1, y: 1, duration: 0.15 }))
    return { container: c, label }
  }

  setCoinBalance(v: number): void {
    this.coins = v
    this.coinText.text = `$${v}`
  }

  setRewardInfo(info: RewardInfo): void {
    this.rewardInfo = info
    this.renderRewardText()
  }

  private renderRewardText(): void {
    if (!this.rewardInfo) {
      this.rewardText.text = ''
      return
    }
    const r = this.rewardInfo
    this.rewardText.text = t('shop.reward_info', {
      round: r.round,
      total: r.total,
      base: r.base,
      clears: r.clears,
      steps: r.steps,
      interest: r.interest
    })
  }

  setItems(items: ShopItem[]): void {
    this.items = items
    this.renderItems()
  }

  private renderItems(): void {
    this.itemContainer.removeChildren()
    for (let i = 0; i < this.items.length && i < ITEMS_PER_ROW; i++) {
      const item = this.items[i]
      const card = this.makeItemCard(item)
      card.x = i * (ITEM_W + 14)
      card.y = 0
      this.itemContainer.addChild(card)
    }
  }

  private makeItemCard(item: ShopItem): Container {
    const c = new Container()
    const def = item.kind === 'insect' ? item.insectDef!
      : item.kind === 'scroll' ? item.scrollDef!
      : item.potionDef!
    const rarity = def.rarity
    const color = def.color
    const glyph = def.glyph
    const nameKey = item.kind === 'insect'
      ? `insect.${def.id}.name`
      : item.kind === 'scroll'
      ? `scroll.${def.id}.name`
      : `potion.${def.id}.name`
    const descKey = item.kind === 'insect'
      ? `insect.${def.id}.desc`
      : item.kind === 'scroll'
      ? `scroll.${def.id}.desc`
      : `potion.${def.id}.desc`
    const kindLabelKey = item.kind === 'insect' ? 'shop.kind_insect'
      : item.kind === 'scroll' ? 'shop.kind_scroll'
      : 'shop.kind_potion'

    const bg = new Graphics()
    bg.roundRect(0, 0, ITEM_W, ITEM_H, 12)
      .fill({ color: 0x2a1a3e })
      .stroke({ width: 2, color })
    c.addChild(bg)

    const kindLabel = new Text({
      text: t(kindLabelKey),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        fill: COLORS.textDim,
        letterSpacing: 3
      })
    })
    kindLabel.x = 10
    kindLabel.y = 8
    c.addChild(kindLabel)

    const rarityText = new Text({
      text: '\u2605'.repeat(rarity),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        fill: COLORS.gold
      })
    })
    rarityText.anchor.set(1, 0)
    rarityText.x = ITEM_W - 10
    rarityText.y = 8
    c.addChild(rarityText)

    const glyphText = new Text({
      text: glyph,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 52,
        fontWeight: 'bold',
        fill: color
      })
    })
    glyphText.anchor.set(0.5)
    glyphText.x = ITEM_W / 2
    glyphText.y = 60
    c.addChild(glyphText)

    const nameText = new Text({
      text: t(nameKey),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: ITEM_W - 16
      })
    })
    nameText.anchor.set(0.5, 0)
    nameText.x = ITEM_W / 2
    nameText.y = 100
    c.addChild(nameText)

    const descText = new Text({
      text: t(descKey),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        fill: 0xcbbfe0,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: ITEM_W - 16,
        lineHeight: 14
      })
    })
    descText.anchor.set(0.5, 0)
    descText.x = ITEM_W / 2
    descText.y = 128
    c.addChild(descText)

    const priceBg = new Graphics()
    const priceColor = item.purchased ? 0x4a3a5a : (this.coins >= item.price ? COLORS.gold : 0x5a3030)
    priceBg.roundRect(0, 0, ITEM_W - 20, 30, 6).fill({ color: priceColor })
    priceBg.x = 10
    priceBg.y = ITEM_H - 40
    c.addChild(priceBg)

    const priceText = new Text({
      text: item.purchased ? t('shop.owned') : `$${item.price}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: item.purchased ? 0x888888 : 0x2a1a00
      })
    })
    priceText.anchor.set(0.5)
    priceText.x = ITEM_W / 2
    priceText.y = ITEM_H - 25
    c.addChild(priceText)

    if (!item.purchased) {
      c.eventMode = 'static'
      c.cursor = 'pointer'
      c.on('pointerover', () => gsap.to(c.scale, { x: 1.04, y: 1.04, duration: 0.15 }))
      c.on('pointerout', () => gsap.to(c.scale, { x: 1, y: 1, duration: 0.15 }))
      c.on('pointerdown', () => {
        if (this.coins < item.price) {
          gsap.timeline()
            .to(c, { x: c.x - 6, duration: 0.05 })
            .to(c, { x: c.x + 6, duration: 0.05 })
            .to(c, { x: c.x, duration: 0.05 })
          return
        }
        const ok = this.onBuy?.(item) ?? false
        if (ok) {
          item.purchased = true
          this.renderItems()
        }
      })
    }

    return c
  }

  show(): void {
    this.visible = true
    this.dim.alpha = 0
    this.panel.scale.set(0.85)
    this.panel.alpha = 0
    gsap.to(this.dim, { alpha: 0.82, duration: 0.3 })
    gsap.to(this.panel.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' })
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
    this.titleText.text = t('shop.title')
    this.rerollBtnLabel.text = t('shop.reroll', { cost: REROLL_COST })
    this.nextBtnLabel.text = t('shop.next_round')
    this.renderRewardText()
    this.renderItems()
  }
}

export function rollShopItems(rng: () => number = Math.random): ShopItem[] {
  const insectKeys = Object.keys(INSECT_CARDS)
  const scrollKeys = Object.keys(SCROLLS)
  const potionKeys = Object.keys(POTIONS)

  const items: ShopItem[] = []
  for (const k of pickN(insectKeys, 2, rng)) {
    const def = INSECT_CARDS[k]
    items.push({ kind: 'insect', insectDef: def, price: def.price })
  }
  for (const k of pickN(scrollKeys, 2, rng)) {
    const def = SCROLLS[k]
    items.push({ kind: 'scroll', scrollDef: def, price: def.price })
  }
  for (const k of pickN(potionKeys, 1, rng)) {
    const def = POTIONS[k]
    items.push({ kind: 'potion', potionDef: def, price: def.price })
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(n, copy.length))
}
