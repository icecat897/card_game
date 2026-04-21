import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants'

export class Tooltip extends Container {
  private bg: Graphics
  private textNode: Text

  constructor() {
    super()
    this.visible = false
    this.eventMode = 'none'

    this.bg = new Graphics()
    this.addChild(this.bg)

    this.textNode = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 260,
        lineHeight: 18
      })
    })
    this.textNode.x = 10
    this.textNode.y = 8
    this.addChild(this.textNode)
  }

  show(text: string, x: number, y: number): void {
    this.textNode.text = text
    const w = Math.min(280, this.textNode.width + 20)
    const h = this.textNode.height + 16
    this.bg.clear()
    this.bg.roundRect(0, 0, w, h, 8)
      .fill({ color: 0x0a0612, alpha: 0.95 })
      .stroke({ width: 1, color: COLORS.accent, alpha: 0.6 })

    let px = x - w / 2
    let py = y
    if (px < 4) px = 4
    if (px + w > GAME_WIDTH - 4) px = GAME_WIDTH - w - 4
    if (py + h > GAME_HEIGHT - 4) py = y - h - 16
    this.x = px
    this.y = py
    this.visible = true
  }

  hide(): void {
    this.visible = false
  }
}
