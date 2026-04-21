import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_WIDTH } from '../config/constants'
import { t } from '../i18n/i18n'

export class HUD extends Container {
  private anteText: Text
  private bossBadgeBg: Graphics
  private bossBadgeText: Text
  private scoreLabelText: Text
  private scoreText: Text
  private targetText: Text
  private stepsLabelText: Text
  private stepsText: Text
  private comboLabelText: Text
  private comboText: Text
  private chipsLabelText: Text
  private chipsPreview: Text
  private multPreview: Text
  private progressFill: Graphics
  private coinsLabelText: Text
  private coinsText: Text
  private xmultLabelText: Text
  private xmultText: Text

  private score: number = 0
  private target: number = 300
  private anteLabel: string = ''
  private hudHeight = 120
  private bossActive: boolean = false

  constructor() {
    super()

    const bg = new Graphics()
    // 主背景：中间略亮的层叠矩形
    const layers = 8
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1)
      const alpha = 0.92 - t * 0.35
      const colorNum = this.mixColor(0x120820, 0x2a1338, Math.sin(t * Math.PI))
      bg.rect(0, i * (this.hudHeight / layers), GAME_WIDTH, this.hudHeight / layers + 1)
        .fill({ color: colorNum, alpha })
    }
    // 下方强调线
    bg.rect(0, this.hudHeight - 2, GAME_WIDTH, 2).fill({ color: COLORS.accent, alpha: 0.55 })
    // 顶部细分线
    bg.rect(0, 0, GAME_WIDTH, 1).fill({ color: COLORS.accent, alpha: 0.3 })
    this.addChild(bg)

    // HUD 分节隔断（垂直浅线）
    const dividers = [420, 700, 880, GAME_WIDTH - 210]
    for (const x of dividers) {
      bg.rect(x, 18, 1, this.hudHeight - 36).fill({ color: COLORS.accent, alpha: 0.18 })
    }

    // 左上角小蛛网装饰
    const emblem = new Graphics()
    emblem.x = GAME_WIDTH / 2
    emblem.y = this.hudHeight + 1
    const arms = 8
    for (let i = 0; i < arms; i++) {
      const a = (Math.PI * 2 * i) / arms
      emblem.moveTo(0, 0)
        .lineTo(Math.cos(a) * 18, Math.sin(a) * 18)
        .stroke({ width: 1, color: COLORS.accent, alpha: 0.35 })
    }
    for (let r = 4; r <= 16; r += 4) {
      const segs = 20
      let fx = 0, fy = 0
      for (let k = 0; k <= segs; k++) {
        const a = (Math.PI * 2 * k) / segs
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r
        if (k === 0) { emblem.moveTo(x, y); fx = x; fy = y }
        else emblem.lineTo(x, y)
      }
      emblem.lineTo(fx, fy).stroke({ width: 0.6, color: COLORS.accent, alpha: 0.28 })
    }
    this.addChild(emblem)

    const labelStyle = new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      fill: COLORS.textDim,
      letterSpacing: 3
    })

    this.anteText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fill: COLORS.accent,
        letterSpacing: 4,
        fontWeight: 'bold'
      })
    })
    this.anteText.x = 40
    this.anteText.y = 14
    this.addChild(this.anteText)

    this.bossBadgeBg = new Graphics()
    this.bossBadgeBg.roundRect(0, 0, 62, 22, 4).fill({ color: COLORS.danger })
    this.bossBadgeBg.x = 168
    this.bossBadgeBg.y = 12
    this.bossBadgeBg.visible = false
    this.addChild(this.bossBadgeBg)
    this.bossBadgeText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 3
      })
    })
    this.bossBadgeText.anchor.set(0.5)
    this.bossBadgeText.x = 168 + 31
    this.bossBadgeText.y = 12 + 11
    this.bossBadgeText.visible = false
    this.addChild(this.bossBadgeText)

    this.scoreLabelText = new Text({ text: '', style: labelStyle })
    this.scoreLabelText.x = 40
    this.scoreLabelText.y = 40
    this.addChild(this.scoreLabelText)

    this.scoreText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 34,
        fontWeight: 'bold',
        fill: COLORS.gold,
        stroke: { color: 0x3a2106, width: 3, alpha: 0.6 },
        dropShadow: {
          color: 0xffcc66,
          alpha: 0.35,
          blur: 8,
          distance: 0,
          angle: 0
        }
      })
    })
    this.scoreText.x = 40
    this.scoreText.y = 56
    this.addChild(this.scoreText)

    const slash = new Text({
      text: '/',
      style: new TextStyle({ fontFamily: 'Georgia', fontSize: 24, fill: COLORS.textDim })
    })
    slash.x = 220
    slash.y = 64
    this.addChild(slash)
    this.targetText = new Text({
      text: '300',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 24, fill: 0xff8aa5 })
    })
    this.targetText.x = 242
    this.targetText.y = 62
    this.addChild(this.targetText)

    const progBg = new Graphics()
    progBg.roundRect(40, 98, 340, 6, 3).fill({ color: 0x261030 })
    this.addChild(progBg)
    this.progressFill = new Graphics()
    this.addChild(this.progressFill)

    this.chipsLabelText = new Text({ text: '', style: labelStyle })
    this.chipsLabelText.x = 440
    this.chipsLabelText.y = 14
    this.addChild(this.chipsLabelText)

    this.chipsPreview = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 30,
        fontWeight: 'bold',
        fill: COLORS.chipBlue,
        stroke: { color: 0x0a1a3a, width: 2, alpha: 0.7 }
      })
    })
    this.chipsPreview.x = 440
    this.chipsPreview.y = 38
    this.addChild(this.chipsPreview)

    const times = new Text({
      text: '\u00d7',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 24, fill: COLORS.textDim })
    })
    times.x = 540
    times.y = 44
    this.addChild(times)

    this.multPreview = new Text({
      text: '1',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 30,
        fontWeight: 'bold',
        fill: COLORS.multRed,
        stroke: { color: 0x3a0a14, width: 2, alpha: 0.7 }
      })
    })
    this.multPreview.x = 570
    this.multPreview.y = 38
    this.addChild(this.multPreview)

    this.xmultLabelText = new Text({ text: '', style: labelStyle })
    this.xmultLabelText.x = 440
    this.xmultLabelText.y = 78
    this.addChild(this.xmultLabelText)
    this.xmultText = new Text({
      text: '\u00d71.0',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fontWeight: 'bold',
        fill: COLORS.xmultPurple
      })
    })
    this.xmultText.x = 440
    this.xmultText.y = 92
    this.addChild(this.xmultText)

    this.comboLabelText = new Text({ text: '', style: labelStyle })
    this.comboLabelText.x = 720
    this.comboLabelText.y = 14
    this.addChild(this.comboLabelText)
    this.comboText = new Text({
      text: '\u2014',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 30,
        fontWeight: 'bold',
        fill: COLORS.accent
      })
    })
    this.comboText.x = 720
    this.comboText.y = 38
    this.addChild(this.comboText)

    this.coinsLabelText = new Text({ text: '', style: labelStyle })
    this.coinsLabelText.x = 900
    this.coinsLabelText.y = 14
    this.addChild(this.coinsLabelText)
    this.coinsText = new Text({
      text: '$0',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        fontWeight: 'bold',
        fill: COLORS.gold,
        stroke: { color: 0x4a2e00, width: 2, alpha: 0.6 }
      })
    })
    this.coinsText.x = 900
    this.coinsText.y = 38
    this.addChild(this.coinsText)

    this.stepsLabelText = new Text({ text: '', style: labelStyle })
    this.stepsLabelText.x = GAME_WIDTH - 180
    this.stepsLabelText.y = 14
    this.addChild(this.stepsLabelText)
    this.stepsText = new Text({
      text: '25',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xa8d0ff,
        stroke: { color: 0x0a1a3a, width: 2, alpha: 0.6 }
      })
    })
    this.stepsText.x = GAME_WIDTH - 180
    this.stepsText.y = 32
    this.addChild(this.stepsText)

    this.applyLang()
    this.drawProgress()
  }

  applyLang(): void {
    this.scoreLabelText.text = t('hud.score')
    this.chipsLabelText.text = t('hud.last_play')
    this.xmultLabelText.text = t('hud.xmult')
    this.comboLabelText.text = t('hud.combo')
    this.coinsLabelText.text = t('hud.coins')
    this.stepsLabelText.text = t('hud.steps')
    this.anteText.text = this.anteLabel
    this.bossBadgeText.text = t('hud.boss_badge')
  }

  setBoss(on: boolean): void {
    this.bossActive = on
    this.bossBadgeBg.visible = on
    this.bossBadgeText.visible = on
    if (on) {
      gsap.fromTo(this.bossBadgeBg.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2.2)' })
      gsap.fromTo(this.bossBadgeText.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.45, ease: 'back.out(2.2)' })
    }
  }

  private drawProgress(): void {
    this.progressFill.clear()
    const ratio = Math.min(1, this.score / Math.max(1, this.target))
    const w = 340 * ratio
    if (w > 0) {
      const color = ratio >= 1 ? COLORS.gold : COLORS.accent
      // 外发光层（半透明拓宽）
      this.progressFill.roundRect(38, 96, w + 4, 10, 4).fill({ color, alpha: 0.35 })
      // 主体
      this.progressFill.roundRect(40, 98, w, 6, 3).fill({ color })
      // 高光线
      this.progressFill.rect(42, 98, Math.max(0, w - 4), 1.5).fill({ color: 0xffffff, alpha: 0.35 })
    }
  }

  setAnte(n: number): void {
    this.anteLabel = t('hud.ante', { n })
    this.anteText.text = this.anteLabel
  }

  setScore(v: number): void {
    this.score = v
    this.scoreText.text = v.toLocaleString()
    this.drawProgress()
    gsap.fromTo(
      this.scoreText.scale,
      { x: 1.15, y: 1.15 },
      { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' }
    )
  }

  setTarget(v: number): void {
    this.target = v
    this.targetText.text = v.toLocaleString()
    this.drawProgress()
  }

  setSteps(v: number): void {
    this.stepsText.text = String(v)
    this.stepsText.style.fill = v <= 5 ? COLORS.danger : 0xa8d0ff
    if (v <= 5) {
      gsap.fromTo(this.stepsText.scale, { x: 1.15, y: 1.15 }, { x: 1, y: 1, duration: 0.3 })
    }
  }

  setCoins(v: number): void {
    this.coinsText.text = `$${v}`
    gsap.fromTo(this.coinsText.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' })
  }

  setLastPlay(chips: number, mult: number): void {
    this.chipsPreview.text = chips.toLocaleString()
    this.multPreview.text = mult.toFixed(mult >= 10 ? 0 : 1)
    gsap.fromTo(
      [this.chipsPreview.scale, this.multPreview.scale],
      { x: 1.2, y: 1.2 },
      { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' }
    )
  }

  setCombo(streak: number, mult: number): void {
    if (streak >= 3) {
      this.comboText.text = `\u00d7${streak}  ${mult.toFixed(2)}x`
      this.comboText.style.fill = streak >= 5 ? COLORS.gold : COLORS.accent
      gsap.fromTo(
        this.comboText.scale,
        { x: 1.3, y: 1.3 },
        { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' }
      )
    } else {
      this.comboText.text = '\u2014'
      this.comboText.style.fill = COLORS.textDim
    }
  }

  setXMult(v: number): void {
    this.xmultText.text = `\u00d7${v.toFixed(1)}`
    if (v > 1) {
      gsap.fromTo(this.xmultText.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' })
    }
  }

  private mixColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
    const r = Math.round(ar + (br - ar) * t)
    const g = Math.round(ag + (bg - ag) * t)
    const bl = Math.round(ab + (bb - ab) * t)
    return (r << 16) | (g << 8) | bl
  }
}
