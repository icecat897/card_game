import { Application } from 'pixi.js'
import { Game } from './Game'
import { GAME_HEIGHT, GAME_WIDTH } from './config/constants'
import './i18n/dict'
import { t } from './i18n/i18n'

async function bootstrap(): Promise<void> {
  const app = new Application()
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: 0x0a0612,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  })

  const container = document.getElementById('game-container')
  if (!container) throw new Error('#game-container not found')
  container.appendChild(app.canvas)

  const loading = document.getElementById('loading')
  if (loading) {
    loading.textContent = t('loading')
    loading.classList.add('hidden')
    setTimeout(() => loading.remove(), 500)
  }

  const game = new Game(app)
  game.start()

  const scaleToFit = () => {
    const sx = window.innerWidth / GAME_WIDTH
    const sy = window.innerHeight / GAME_HEIGHT
    const s = Math.min(sx, sy, 1)
    app.canvas.style.transform = `scale(${s})`
    app.canvas.style.transformOrigin = 'center center'
  }
  scaleToFit()
  window.addEventListener('resize', scaleToFit)
}

bootstrap().catch(err => {
  console.error('[Webmaster] bootstrap failed:', err)
})
