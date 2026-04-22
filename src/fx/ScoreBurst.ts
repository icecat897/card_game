import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants'

/**
 * 两种积分动画：
 *  - playFull：清 K-A 或大分爆发，屏幕中央的三段式（chip × mult = total）
 *  - playCompact：普通移动的 +N 浮字，锚在牌落点附近
 */
export class ScoreBurst extends Container {
  /** 大爆发：蓝色 Chips 从左、红色 Mult 从右 → 对撞 → 金色合计 */
  async playFull(chips: number, totalMult: number, total: number): Promise<void> {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2 - 40

    // 飞入阶段：chip 从左、mult 从右，各带一层彩色光晕
    const chipText = this.bigText(chips.toLocaleString(), COLORS.chipBlue, 0x0a1a3a, 74)
    chipText.x = cx - 260
    chipText.y = cy
    chipText.scale.set(0)

    const multText = this.bigText(`\u00d7${totalMult.toFixed(1)}`, COLORS.multRed, 0x3a0a14, 74)
    multText.x = cx + 260
    multText.y = cy
    multText.scale.set(0)

    const chipGlow = this.glowDisc(COLORS.chipBlue, 0.28, 86)
    chipGlow.position.set(chipText.x, chipText.y)
    chipGlow.scale.set(0)
    const multGlow = this.glowDisc(COLORS.multRed, 0.28, 86)
    multGlow.position.set(multText.x, multText.y)
    multGlow.scale.set(0)

    this.addChild(chipGlow, multGlow, chipText, multText)

    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to([chipText.scale, multText.scale], { x: 1, y: 1, duration: 0.28, ease: 'back.out(2.4)' }, 0)
        .to([chipGlow.scale, multGlow.scale], { x: 1.15, y: 1.15, duration: 0.3, ease: 'power2.out' }, 0)
    })

    // 碰撞阶段：两个数字贴近中心
    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to([chipText, chipGlow], { x: cx - 18, duration: 0.3, ease: 'power2.in' }, 0)
        .to([multText, multGlow], { x: cx + 18, duration: 0.3, ease: 'power2.in' }, 0)
    })

    // 碰撞瞬间清理飞入元素，用冲击波 + 闪光 + 粒子替代
    chipText.destroy()
    multText.destroy()
    chipGlow.destroy()
    multGlow.destroy()

    const flash = new Graphics()
    flash.circle(0, 0, 140).fill({ color: 0xffffff, alpha: 0.85 })
    flash.position.set(cx, cy)
    this.addChild(flash)
    gsap.timeline()
      .fromTo(flash.scale, { x: 0.25, y: 0.25 }, { x: 1.9, y: 1.9, duration: 0.35, ease: 'power2.out' })
      .to(flash, { alpha: 0, duration: 0.3, ease: 'power2.out' }, 0)
      .call(() => flash.destroy())

    // 冲击波环（两层）
    const ring = new Graphics()
    ring.position.set(cx, cy)
    this.addChildAt(ring, 0)
    const ringState = { r: 20, alpha: 1 }
    gsap.to(ringState, {
      r: 320,
      alpha: 0,
      duration: 0.85,
      ease: 'power2.out',
      onUpdate: () => {
        ring.clear()
        ring.circle(0, 0, ringState.r).stroke({
          width: 6, color: COLORS.gold, alpha: ringState.alpha * 0.65
        })
        ring.circle(0, 0, ringState.r * 0.65).stroke({
          width: 3, color: 0xffffff, alpha: ringState.alpha * 0.45
        })
      },
      onComplete: () => ring.destroy()
    })

    // 星芒射线（12 条细线）
    const rays = new Graphics()
    rays.position.set(cx, cy)
    this.addChildAt(rays, 0)
    const rayCount = 12
    const rayState = { t: 0, alpha: 0.85 }
    gsap.to(rayState, {
      t: 1, alpha: 0,
      duration: 0.8, ease: 'power2.out',
      onUpdate: () => {
        rays.clear()
        const len = 40 + rayState.t * 220
        for (let i = 0; i < rayCount; i++) {
          const a = (Math.PI * 2 * i) / rayCount + Math.PI / 12
          const ex = Math.cos(a) * len
          const ey = Math.sin(a) * len
          // 内侧粗线
          rays.moveTo(0, 0).lineTo(ex, ey)
            .stroke({ width: 5, color: COLORS.gold, alpha: rayState.alpha * 0.55 })
          // 核心亮线
          rays.moveTo(0, 0).lineTo(ex * 0.6, ey * 0.6)
            .stroke({ width: 2, color: 0xffffff, alpha: rayState.alpha * 0.7 })
        }
      },
      onComplete: () => rays.destroy()
    })

    // 粒子爆炸（多色、带重力）
    const particles = new Graphics()
    particles.position.set(cx, cy)
    this.addChild(particles)
    const palette = [COLORS.gold, 0xffe8a8, 0xfff8d8, COLORS.chipBlue, COLORS.multRed, COLORS.accent]
    const particleData = Array.from({ length: 34 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 200 + Math.random() * 220
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: 3.5 + Math.random() * 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        rot: Math.random() * Math.PI * 2
      }
    })
    const pState = { t: 0 }
    gsap.to(pState, {
      t: 1,
      duration: 0.95,
      ease: 'power2.out',
      onUpdate: () => {
        particles.clear()
        const tt = pState.t
        for (const p of particleData) {
          const x = p.vx * tt
          const y = p.vy * tt + 300 * tt * tt
          const alpha = 1 - tt * 0.9
          const size = p.size * (1 - tt * 0.45)
          particles.circle(x, y, size).fill({ color: p.color, alpha })
        }
      },
      onComplete: () => particles.destroy()
    })

    await new Promise(r => setTimeout(r, 100))

    // 最终合计数：金色 + 阴影光晕 + 弹性缩放
    const totalText = this.bigText(total.toLocaleString(), COLORS.gold, 0x4a2e00, 128)
    totalText.position.set(cx, cy)
    totalText.scale.set(0)
    this.addChild(totalText)

    const totalGlow = this.glowDisc(COLORS.gold, 0.35, 130)
    totalGlow.position.set(cx, cy)
    totalGlow.scale.set(0)
    this.addChildAt(totalGlow, Math.max(0, this.children.indexOf(totalText)))

    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to(totalText.scale, { x: 1.3, y: 1.3, duration: 0.28, ease: 'back.out(3.5)' })
        .to(totalGlow.scale, { x: 1.6, y: 1.6, duration: 0.3, ease: 'power2.out' }, 0)
        .to(totalText.scale, { x: 1, y: 1, duration: 0.22, ease: 'power2.out' })
        .to([totalText, totalGlow], {
          alpha: 0, y: cy - 110, duration: 0.7, ease: 'power2.in'
        }, '+=0.3')
    })
    totalText.destroy()
    totalGlow.destroy()
  }

  /**
   * 小浮字：落点附近显示 "+N"，颜色随分数从蓝→紫→金过渡，轻巧上浮 fade。
   * 不阻塞，不等待；一次可同时存在多个（例如连击）。
   */
  playCompact(total: number, x: number, y: number, streak: number = 0): void {
    const isBig = total >= 500
    const isMedium = total >= 120

    const color = isBig ? COLORS.gold : (isMedium ? COLORS.accent : COLORS.chipBlue)
    const strokeColor = isBig ? 0x4a2e00 : (isMedium ? 0x2a0a3a : 0x0a1a3a)
    const fontSize = isBig ? 46 : (isMedium ? 34 : 26)

    const text = new Text({
      text: `+${total.toLocaleString()}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize,
        fontWeight: 'bold',
        fill: color,
        stroke: { color: strokeColor, width: 3, alpha: 0.9 },
        dropShadow: {
          color,
          alpha: 0.55,
          blur: 12,
          distance: 0,
          angle: 0
        }
      })
    })
    text.anchor.set(0.5)
    text.position.set(x, y)
    text.alpha = 0
    text.scale.set(0.5)

    let glow: Graphics | null = null
    if (isBig || isMedium) {
      glow = this.glowDisc(color, 0.3, isBig ? 44 : 30)
      glow.position.set(x, y)
      glow.scale.set(0.3)
      this.addChild(glow)
    }
    this.addChild(text)

    // 如果有 combo streak，在数字右上角附一个 "×N" 徽标
    let comboTag: Text | null = null
    if (streak >= 3) {
      comboTag = new Text({
        text: `\u00d7${streak}`,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: fontSize * 0.55,
          fontWeight: 'bold',
          fill: COLORS.gold,
          stroke: { color: 0x4a2e00, width: 2, alpha: 0.9 }
        })
      })
      comboTag.anchor.set(0, 1)
      comboTag.position.set(x + fontSize * 0.8, y - fontSize * 0.2)
      comboTag.alpha = 0
      comboTag.scale.set(0.4)
      this.addChild(comboTag)
    }

    gsap.timeline()
      .to(text, { alpha: 1, duration: 0.12 }, 0)
      .to(text.scale, { x: 1, y: 1, duration: 0.26, ease: 'back.out(2.5)' }, 0)
      .to(text, { y: y - 72, duration: 0.9, ease: 'power2.out' }, 0)
      .to(text, { alpha: 0, duration: 0.35, ease: 'power2.in' }, 0.6)
      .call(() => text.destroy())

    if (glow) {
      gsap.timeline()
        .to(glow.scale, { x: 1.4, y: 1.4, duration: 0.35, ease: 'power2.out' }, 0)
        .to(glow, { y: y - 72, alpha: 0, duration: 0.95, ease: 'power2.out' }, 0)
        .call(() => glow!.destroy())
    }

    if (comboTag) {
      gsap.timeline()
        .to(comboTag, { alpha: 1, duration: 0.12 }, 0.08)
        .to(comboTag.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2.8)' }, 0.08)
        .to(comboTag, { y: y - 72 - fontSize * 0.2, duration: 0.9, ease: 'power2.out' }, 0)
        .to(comboTag, { alpha: 0, duration: 0.35, ease: 'power2.in' }, 0.65)
        .call(() => comboTag!.destroy())
    }
  }

  // 兼容旧调用
  async play(chips: number, totalMult: number, total: number): Promise<void> {
    await this.playFull(chips, totalMult, total)
  }

  private bigText(text: string, fill: number, stroke: number, fontSize: number): Text {
    const t = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize,
        fontWeight: 'bold',
        fill,
        stroke: { color: stroke, width: 7 },
        dropShadow: {
          color: fill,
          alpha: 0.45,
          blur: 14,
          distance: 0,
          angle: 0
        }
      })
    })
    t.anchor.set(0.5)
    return t
  }

  private glowDisc(color: number, alpha: number, radius: number): Graphics {
    const g = new Graphics()
    // 多层同心圆模拟软光晕
    for (let i = 6; i > 0; i--) {
      const t = i / 6
      g.circle(0, 0, radius * t)
        .fill({ color, alpha: alpha * (1 - t) * 0.8 })
    }
    return g
  }
}
