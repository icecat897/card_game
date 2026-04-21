import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gsap } from 'gsap'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants'

export class ScoreBurst extends Container {
  async play(chips: number, totalMult: number, total: number): Promise<void> {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2 - 40

    const chipText = new Text({
      text: chips.toLocaleString(),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 78,
        fontWeight: 'bold',
        fill: COLORS.chipBlue,
        stroke: { color: 0x0a1a3a, width: 7 }
      })
    })
    chipText.anchor.set(0.5)
    chipText.x = cx - 260
    chipText.y = cy
    chipText.scale.set(0)
    this.addChild(chipText)

    const multText = new Text({
      text: `\u00d7${totalMult.toFixed(1)}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 78,
        fontWeight: 'bold',
        fill: COLORS.multRed,
        stroke: { color: 0x3a0a14, width: 7 }
      })
    })
    multText.anchor.set(0.5)
    multText.x = cx + 260
    multText.y = cy
    multText.scale.set(0)
    this.addChild(multText)

    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to([chipText.scale, multText.scale], { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' })
        .to([chipText, multText], { x: cx, duration: 0.28, ease: 'power2.in' }, '+=0.18')
    })

    await new Promise(r => setTimeout(r, 130))
    chipText.destroy()
    multText.destroy()

    const burst = new Graphics()
    burst.x = cx
    burst.y = cy
    this.addChild(burst)

    const burstState = { t: 0, alpha: 1 }
    gsap.to(burstState, {
      t: 1,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate: () => {
        burst.clear()
        const radius = 40 + burstState.t * 180
        const a = 1 - burstState.t
        for (let i = 0; i < 20; i++) {
          const ang = (Math.PI * 2 * i) / 20
          const dx = Math.cos(ang) * radius
          const dy = Math.sin(ang) * radius
          burst.circle(dx, dy, 7 * a).fill({ color: COLORS.gold, alpha: a })
        }
      },
      onComplete: () => burst.destroy()
    })

    const totalText = new Text({
      text: total.toLocaleString(),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 128,
        fontWeight: 'bold',
        fill: COLORS.gold,
        stroke: { color: 0x4a2e00, width: 9 }
      })
    })
    totalText.anchor.set(0.5)
    totalText.x = cx
    totalText.y = cy
    totalText.scale.set(0)
    this.addChild(totalText)

    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: () => resolve() })
        .to(totalText.scale, { x: 1.35, y: 1.35, duration: 0.22, ease: 'back.out(4)' })
        .to(totalText.scale, { x: 1, y: 1, duration: 0.18 })
        .to(totalText, { alpha: 0, y: cy - 100, duration: 0.55, ease: 'power2.in' }, '+=0.35')
    })
    totalText.destroy()
  }
}
