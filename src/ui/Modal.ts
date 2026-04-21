import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants'
import { t } from '../i18n/i18n'

export type ModalKind = 'win' | 'lose' | 'campaign'

export interface ModalBreakdownLine {
  key: string
  params?: Record<string, string | number>
  value: number
}

export interface ModalInfo {
  score: number
  target: number
  coinReward?: number
  totalCoins?: number
  breakdown?: ModalBreakdownLine[]
}

export class Modal extends Container {
  private dim: Graphics
  private panel: Container
  private title: Text
  private scoreLine: Text
  private rewardLines: Text[] = []
  private button: Container
  private buttonLabel: Text
  private onConfirmCb?: () => void
  private currentKind: ModalKind = 'win'
  private currentInfo: ModalInfo | null = null

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'static'

    this.dim = new Graphics()
    this.dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.7 })
    this.addChild(this.dim)
    this.dim.eventMode = 'static'

    this.panel = new Container()
    const panelW = 580
    const panelH = 420
    this.panel.x = (GAME_WIDTH - panelW) / 2
    this.panel.y = (GAME_HEIGHT - panelH) / 2
    const bg = new Graphics()
    bg.roundRect(0, 0, panelW, panelH, 16)
      .fill({ color: 0x1a0f2e })
      .stroke({ width: 3, color: COLORS.accent })
    this.panel.addChild(bg)
    this.addChild(this.panel)

    this.title = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 52,
        fontWeight: 'bold',
        fill: COLORS.gold
      })
    })
    this.title.anchor.set(0.5)
    this.title.x = panelW / 2
    this.title.y = 60
    this.panel.addChild(this.title)

    this.scoreLine = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fill: 0xffffff
      })
    })
    this.scoreLine.anchor.set(0.5)
    this.scoreLine.x = panelW / 2
    this.scoreLine.y = 130
    this.panel.addChild(this.scoreLine)

    this.button = new Container()
    this.button.eventMode = 'static'
    this.button.cursor = 'pointer'
    const btnBg = new Graphics()
    btnBg.roundRect(0, 0, 220, 60, 10)
      .fill({ color: COLORS.accent })
      .stroke({ width: 2, color: COLORS.gold })
    this.button.addChild(btnBg)
    this.buttonLabel = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 'bold',
        letterSpacing: 3
      })
    })
    this.buttonLabel.anchor.set(0.5)
    this.buttonLabel.x = 110
    this.buttonLabel.y = 30
    this.button.addChild(this.buttonLabel)
    this.button.x = (panelW - 220) / 2
    this.button.y = 330
    this.button.on('pointerover', () => gsap.to(this.button.scale, { x: 1.05, y: 1.05, duration: 0.15 }))
    this.button.on('pointerout', () => gsap.to(this.button.scale, { x: 1, y: 1, duration: 0.15 }))
    this.button.on('pointerdown', () => this.onConfirmCb?.())
    this.panel.addChild(this.button)
  }

  private render(): void {
    const kind = this.currentKind
    const info = this.currentInfo
    if (!info) return

    if (kind === 'win') {
      this.title.text = t('modal.win_title')
      this.title.style.fill = COLORS.gold
      this.buttonLabel.text = t('modal.next_ante')
    } else if (kind === 'campaign') {
      this.title.text = t('modal.campaign_title')
      this.title.style.fill = COLORS.gold
      this.buttonLabel.text = t('modal.new_run')
    } else {
      this.title.text = t('modal.lose_title')
      this.title.style.fill = COLORS.danger
      this.buttonLabel.text = t('modal.restart')
    }

    this.scoreLine.text = t('modal.score_line', {
      score: info.score.toLocaleString(),
      target: info.target.toLocaleString()
    })

    this.rewardLines.forEach(r => r.destroy())
    this.rewardLines = []
    if (info.breakdown && info.breakdown.length > 0) {
      let y = 170
      for (const line of info.breakdown) {
        const text = new Text({
          text: `${t(line.key, line.params)}   +$${line.value}`,
          style: new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 18,
            fill: COLORS.textDim
          })
        })
        text.anchor.set(0.5)
        text.x = 290
        text.y = y
        this.panel.addChild(text)
        this.rewardLines.push(text)
        y += 26
      }
    }
  }

  show(kind: ModalKind, info: ModalInfo, onConfirm: () => void): void {
    this.currentKind = kind
    this.currentInfo = info
    this.onConfirmCb = onConfirm
    this.visible = true
    this.render()

    this.panel.scale.set(0.8)
    this.panel.alpha = 0
    this.dim.alpha = 0
    gsap.to(this.dim, { alpha: 0.7, duration: 0.3 })
    gsap.to(this.panel.scale, { x: 1, y: 1, duration: 0.38, ease: 'back.out(2)' })
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
          this.currentInfo = null
          resolve()
        }
      })
    })
  }

  applyLang(): void {
    if (this.visible) this.render()
  }
}
