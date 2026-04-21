import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants'
import { t } from '../i18n/i18n'

const TAB_KEYS = ['rules', 'scoring', 'enh', 'insects', 'tips'] as const

export class HelpModal extends Container {
  private dim: Graphics
  private panel: Container
  private headerTitle: Text
  private titleText: Text
  private bodyText: Text
  private tabButtons: Container[] = []
  private tabLabels: Text[] = []
  private tabBgs: Graphics[] = []
  private closeBtnLabel: Text
  private activeTabKey: string = 'rules'

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'static'

    this.dim = new Graphics()
    this.dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.78 })
    this.dim.eventMode = 'static'
    this.dim.on('pointerdown', () => this.close())
    this.addChild(this.dim)

    this.panel = new Container()
    const panelW = 880
    const panelH = 600
    this.panel.x = (GAME_WIDTH - panelW) / 2
    this.panel.y = (GAME_HEIGHT - panelH) / 2
    const bg = new Graphics()
    bg.roundRect(0, 0, panelW, panelH, 18)
      .fill({ color: 0x1a0f2e })
      .stroke({ width: 3, color: COLORS.accent })
    this.panel.addChild(bg)
    this.panel.eventMode = 'static'
    this.panel.on('pointerdown', (e) => e.stopPropagation())
    this.addChild(this.panel)

    this.headerTitle = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: COLORS.gold,
        letterSpacing: 5
      })
    })
    this.headerTitle.x = 30
    this.headerTitle.y = 20
    this.panel.addChild(this.headerTitle)

    const closeBtn = new Container()
    closeBtn.eventMode = 'static'
    closeBtn.cursor = 'pointer'
    const closeG = new Graphics()
    closeG.circle(16, 16, 14)
      .fill({ color: 0x2a1a3e })
      .stroke({ width: 1, color: COLORS.accent })
    closeBtn.addChild(closeG)
    this.closeBtnLabel = new Text({
      text: 'x',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xffffff
      })
    })
    this.closeBtnLabel.anchor.set(0.5)
    this.closeBtnLabel.x = 16
    this.closeBtnLabel.y = 16
    closeBtn.addChild(this.closeBtnLabel)
    closeBtn.x = panelW - 50
    closeBtn.y = 20
    closeBtn.on('pointerdown', () => this.close())
    this.panel.addChild(closeBtn)

    const tabBarY = 66
    let tx = 30
    for (const key of TAB_KEYS) {
      const { container, label, bg } = this.makeTabButton(key)
      container.x = tx
      container.y = tabBarY
      this.tabButtons.push(container)
      this.tabLabels.push(label)
      this.tabBgs.push(bg)
      this.panel.addChild(container)
      tx += 150
    }

    const divider = new Graphics()
    divider.rect(30, tabBarY + 46, panelW - 60, 1).fill({ color: COLORS.accent, alpha: 0.3 })
    this.panel.addChild(divider)

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fontWeight: 'bold',
        fill: COLORS.gold
      })
    })
    this.titleText.x = 40
    this.titleText.y = 130
    this.panel.addChild(this.titleText)

    this.bodyText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fill: 0xe0d8f0,
        wordWrap: true,
        wordWrapWidth: panelW - 80,
        lineHeight: 22
      })
    })
    this.bodyText.x = 40
    this.bodyText.y = 168
    this.panel.addChild(this.bodyText)

    this.applyLang()
    this.selectTab('rules')
  }

  private makeTabButton(key: string): { container: Container; label: Text; bg: Graphics } {
    const c = new Container()
    c.eventMode = 'static'
    c.cursor = 'pointer'
    const g = new Graphics()
    const w = 140
    const h = 36
    g.roundRect(0, 0, w, h, 8)
      .fill({ color: 0x2a1a3e })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.5 })
    c.addChild(g)
    const label = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xcbbfe0,
        letterSpacing: 2
      })
    })
    label.anchor.set(0.5)
    label.x = w / 2
    label.y = h / 2
    c.addChild(label)
    c.on('pointerdown', () => this.selectTab(key))
    c.on('pointerover', () => gsap.to(c.scale, { x: 1.05, y: 1.05, duration: 0.1 }))
    c.on('pointerout', () => gsap.to(c.scale, { x: 1, y: 1, duration: 0.1 }))
    return { container: c, label, bg: g }
  }

  private selectTab(key: string): void {
    this.activeTabKey = key
    for (let i = 0; i < TAB_KEYS.length; i++) {
      const tabKey = TAB_KEYS[i]
      const isActive = tabKey === key
      this.tabBgs[i].clear()
      this.tabBgs[i].roundRect(0, 0, 140, 36, 8)
        .fill({ color: isActive ? COLORS.accent : 0x2a1a3e })
        .stroke({ width: 1, color: COLORS.accent, alpha: isActive ? 1 : 0.5 })
      this.tabLabels[i].style.fill = isActive ? 0xffffff : 0xcbbfe0
    }
    this.titleText.text = t(`help.${key}.title`)
    this.bodyText.text = t(`help.${key}.body`)
  }

  applyLang(): void {
    this.headerTitle.text = t('help.title')
    for (let i = 0; i < TAB_KEYS.length; i++) {
      this.tabLabels[i].text = t(`help.tab.${TAB_KEYS[i]}`)
    }
    this.selectTab(this.activeTabKey)
  }

  open(): void {
    this.visible = true
    this.dim.alpha = 0
    this.panel.scale.set(0.9)
    this.panel.alpha = 0
    gsap.to(this.dim, { alpha: 0.78, duration: 0.25 })
    gsap.to(this.panel.scale, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' })
    gsap.to(this.panel, { alpha: 1, duration: 0.25 })
  }

  close(): void {
    gsap.to(this.dim, { alpha: 0, duration: 0.18 })
    gsap.to(this.panel, {
      alpha: 0,
      duration: 0.18,
      onComplete: () => { this.visible = false }
    })
  }
}
