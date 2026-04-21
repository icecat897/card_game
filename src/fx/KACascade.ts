import { Container, Graphics } from 'pixi.js'
import { gsap } from 'gsap'
import { CardSprite } from '../ui/CardSprite'
import { CARD_HEIGHT, CARD_WIDTH, GAME_HEIGHT, GAME_WIDTH, COLORS, ANIM } from '../config/constants'

export class KACascade extends Container {
  /**
   * 13 张牌蛛茧 → 破茧 → 蛛网裂纹三段式。
   * @param cardSprites 13 张（已从原父容器中移除，由调用方 addChild 到本容器）
   */
  async play(cardSprites: CardSprite[]): Promise<void> {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const targetX = cx - CARD_WIDTH / 2
    const targetY = cy - CARD_HEIGHT / 2

    await new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: () => resolve() })
      cardSprites.forEach((s, i) => {
        const offset = i * ANIM.KA_PER_CARD
        tl.to(s, {
          x: targetX,
          y: targetY,
          duration: 0.45,
          ease: 'power2.inOut'
        }, offset)
          .to(s.inner.scale, {
            x: 0.35,
            y: 0.35,
            duration: 0.45,
            ease: 'power1.in'
          }, offset)
          .to(s.inner, {
            rotation: Math.random() * Math.PI * 2,
            duration: 0.45
          }, offset)
      })
    })

    const core = new Graphics()
    core.x = cx
    core.y = cy
    core.circle(0, 0, 30).fill({ color: COLORS.gold, alpha: 0.9 })
    this.addChild(core)
    gsap.fromTo(core.scale, { x: 0, y: 0 }, { x: 2.2, y: 2.2, duration: 0.3, ease: 'power2.out' })
    await new Promise(r => setTimeout(r, 300))

    cardSprites.forEach(s => gsap.to(s, { alpha: 0, duration: 0.2 }))

    const cracks = new Graphics()
    cracks.x = cx
    cracks.y = cy
    this.addChild(cracks)

    const rays: { angle: number; len: number }[] = []
    const lineCount = 16
    for (let i = 0; i < lineCount; i++) {
      rays.push({
        angle: (Math.PI * 2 * i) / lineCount + (Math.random() - 0.5) * 0.3,
        len: 420 + Math.random() * 280
      })
    }
    const crackState = { t: 0, alpha: 1 }
    gsap.to(crackState, {
      t: 1,
      alpha: 0,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => {
        cracks.clear()
        for (const r of rays) {
          const x2 = Math.cos(r.angle) * r.len * crackState.t
          const y2 = Math.sin(r.angle) * r.len * crackState.t
          cracks.moveTo(0, 0).lineTo(x2, y2)
            .stroke({ width: 2.5, color: COLORS.gold, alpha: 0.75 * crackState.alpha })
          const bx = x2 + Math.cos(r.angle + 1.3) * 45
          const by = y2 + Math.sin(r.angle + 1.3) * 45
          cracks.moveTo(x2, y2).lineTo(bx, by)
            .stroke({ width: 1.2, color: COLORS.gold, alpha: 0.45 * crackState.alpha })
        }
      },
      onComplete: () => cracks.destroy()
    })

    gsap.to(core, {
      alpha: 0,
      duration: 0.6,
      onComplete: () => core.destroy()
    })

    const particles = new Graphics()
    particles.x = cx
    particles.y = cy
    this.addChild(particles)
    const pState = { t: 0, alpha: 1 }
    gsap.to(pState, {
      t: 1,
      alpha: 0,
      duration: 1.2,
      onUpdate: () => {
        particles.clear()
        for (let i = 0; i < 40; i++) {
          const a = (Math.PI * 2 * i) / 40 + pState.t * 2
          const r = 20 + pState.t * 260
          const size = 5 * (1 - pState.t * 0.7)
          particles.circle(Math.cos(a) * r, Math.sin(a) * r, size)
            .fill({ color: 0xffe08a, alpha: pState.alpha })
        }
      },
      onComplete: () => particles.destroy()
    })

    await new Promise(r => setTimeout(r, 1400))
    cardSprites.forEach(s => s.destroy())
  }
}
