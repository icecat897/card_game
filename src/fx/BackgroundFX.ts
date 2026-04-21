import { Container, Graphics } from 'pixi.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants'

/**
 * 动画化的环境背景层：
 *  - 径向渐变（暗紫 → 墨黑）
 *  - 巨型旋转蛛网（极低亮度）
 *  - 缓慢漂浮的尘埃/孢子颗粒
 *  - 外侧暗角 vignette
 */
export class BackgroundFX extends Container {
  private web: Graphics
  private gradient: Graphics
  private vignette: Graphics
  private dust: Graphics
  private particles: { x: number; y: number; r: number; vx: number; vy: number; hue: number; life: number }[]
  private tick = 0

  constructor() {
    super()
    this.eventMode = 'none'

    this.gradient = new Graphics()
    this.addChild(this.gradient)
    this.drawGradient()

    this.web = new Graphics()
    this.web.x = GAME_WIDTH / 2
    this.web.y = GAME_HEIGHT / 2 + 80
    this.addChild(this.web)
    this.drawWeb()

    this.dust = new Graphics()
    this.addChild(this.dust)

    this.vignette = new Graphics()
    this.addChild(this.vignette)
    this.drawVignette()

    this.particles = []
    for (let i = 0; i < 48; i++) {
      this.particles.push(this.spawnParticle(Math.random() * GAME_HEIGHT))
    }
  }

  private drawGradient(): void {
    const g = this.gradient
    g.clear()
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const ringCount = 14
    for (let i = ringCount; i > 0; i--) {
      const t = i / ringCount
      const r = (GAME_WIDTH * 0.7) * t
      const hexColor = this.lerpColor(0x2a1138, 0x060309, t)
      g.circle(cx, cy, r).fill({ color: hexColor })
    }
    g.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x060309, alpha: 0.35 })
  }

  private drawVignette(): void {
    const v = this.vignette
    v.clear()
    const rings = 18
    for (let i = 0; i < rings; i++) {
      const t = i / rings
      const inset = t * 200
      const alpha = (1 - t) * 0.055
      v.rect(inset, inset, GAME_WIDTH - inset * 2, GAME_HEIGHT - inset * 2)
        .stroke({ width: 2, color: 0x000000, alpha })
    }
  }

  private drawWeb(): void {
    const w = this.web
    w.clear()
    const radii = [60, 130, 210, 310, 420, 560]
    const rings = 10
    const spokes = 18
    const color = 0x3a2757
    const alphaBase = 0.08
    for (let s = 0; s < spokes; s++) {
      const ang = (Math.PI * 2 * s) / spokes
      const end = radii[radii.length - 1]
      w.moveTo(0, 0)
        .lineTo(Math.cos(ang) * end, Math.sin(ang) * end)
        .stroke({ width: 1, color, alpha: alphaBase })
    }
    for (let r = 0; r < rings; r++) {
      const t = r / (rings - 1)
      const radius = 50 + t * 520
      const segs = 64
      const alpha = alphaBase * (1 - t * 0.4)
      let firstX = 0, firstY = 0
      for (let i = 0; i <= segs; i++) {
        const a = (Math.PI * 2 * i) / segs
        const jitter = (Math.sin(a * 3 + r) * 0.5 + 0.5) * 6
        const rr = radius + jitter
        const x = Math.cos(a) * rr
        const y = Math.sin(a) * rr
        if (i === 0) { w.moveTo(x, y); firstX = x; firstY = y }
        else w.lineTo(x, y)
      }
      w.lineTo(firstX, firstY).stroke({ width: 0.8, color, alpha })
    }
    // suppress unused var warning
    void radii
  }

  private spawnParticle(yOverride?: number): { x: number; y: number; r: number; vx: number; vy: number; hue: number; life: number } {
    return {
      x: Math.random() * GAME_WIDTH,
      y: yOverride ?? GAME_HEIGHT + 20,
      r: 0.7 + Math.random() * 2.2,
      vx: -0.18 + Math.random() * 0.36,
      vy: -0.28 - Math.random() * 0.45,
      hue: Math.random() < 0.5 ? 0xd8b8ff : 0xfff2c6,
      life: Math.random()
    }
  }

  /** 每帧更新（由 Game 在 app.ticker 上调用） */
  update(delta: number): void {
    this.tick += delta
    const rot = this.tick * 0.00025
    this.web.rotation = rot
    // 呼吸感亮度
    this.web.alpha = 0.75 + Math.sin(this.tick * 0.015) * 0.2

    this.dust.clear()
    for (const p of this.particles) {
      p.x += p.vx * delta
      p.y += p.vy * delta
      p.life += delta * 0.004
      if (p.y < -20 || p.x < -20 || p.x > GAME_WIDTH + 20) {
        const fresh = this.spawnParticle()
        p.x = fresh.x
        p.y = fresh.y
        p.r = fresh.r
        p.vx = fresh.vx
        p.vy = fresh.vy
        p.hue = fresh.hue
        p.life = 0
      }
      const twinkle = 0.35 + (Math.sin(p.life * 6) * 0.5 + 0.5) * 0.5
      this.dust.circle(p.x, p.y, p.r).fill({ color: p.hue, alpha: twinkle * 0.55 })
      this.dust.circle(p.x, p.y, p.r * 2.4).fill({ color: p.hue, alpha: twinkle * 0.12 })
    }
  }

  private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
    const r = Math.round(ar + (br - ar) * t)
    const g = Math.round(ag + (bg - ag) * t)
    const bl = Math.round(ab + (bb - ab) * t)
    return (r << 16) | (g << 8) | bl
  }
}
