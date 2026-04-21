import { Container } from 'pixi.js'
import { gsap } from 'gsap'

export function screenShake(target: Container, intensity: number = 12, duration: number = 0.45): void {
  const origX = target.x
  const origY = target.y
  const steps = Math.max(6, Math.floor(duration * 30))
  const stepDur = duration / steps
  const tl = gsap.timeline({
    onComplete: () => {
      target.x = origX
      target.y = origY
    }
  })
  for (let i = 0; i < steps; i++) {
    const factor = 1 - i / steps
    const dx = (Math.random() - 0.5) * 2 * intensity * factor
    const dy = (Math.random() - 0.5) * 2 * intensity * factor
    tl.to(target, { x: origX + dx, y: origY + dy, duration: stepDur, ease: 'none' })
  }
  tl.to(target, { x: origX, y: origY, duration: stepDur, ease: 'power2.out' })
}
