import { Application, Container } from 'pixi.js'
import { gsap } from 'gsap'
import { Board } from './game/Board'
import { Run } from './game/Run'
import { Inventory } from './game/Inventory'
import { INSECT_CARDS, rollRandomInsect } from './game/InsectCard'
import { SCROLLS } from './game/Scroll'
import { POTIONS } from './game/Potion'
import { BoardView, type MoveAttempt } from './ui/BoardView'
import { HUD } from './ui/HUD'
import { StockPile } from './ui/StockPile'
import { Modal } from './ui/Modal'
import { CashOutButton } from './ui/CashOutButton'
import { InsectSlots } from './ui/InsectSlots'
import { ScrollTray } from './ui/ScrollTray'
import { PotionTray } from './ui/PotionTray'
import { Shop, type ShopItem, rollShopItems } from './ui/Shop'
import { HelpModal } from './ui/HelpModal'
import { SettingsButton } from './ui/SettingsButton'
import { LanguageToggle } from './ui/LanguageToggle'
import { CharacterSelect } from './ui/CharacterSelect'
import type { CharacterId } from './game/Character'
import { SoundToggle } from './ui/SoundToggle'
import { DeckViewer } from './ui/DeckViewer'
import { DeckButton } from './ui/DeckButton'
import { Tooltip } from './ui/Tooltip'
import { BossBanner } from './ui/BossBanner'
import { ScoreEngine } from './scoring/ScoreEngine'
import { ScoreBurst } from './fx/ScoreBurst'
import { KACascade } from './fx/KACascade'
import { screenShake } from './fx/ScreenShake'
import { sound } from './fx/SoundEngine'
import { BackgroundFX } from './fx/BackgroundFX'
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  COIN_REWARDS,
  COLUMN_COUNT,
  COLUMN_START_X,
  COLUMN_GAP,
  COLUMN_Y,
  GAME_HEIGHT,
  GAME_WIDTH
} from './config/constants'
import type { Card } from './game/Card'
import { onLangChange, t } from './i18n/i18n'
import { checkClearableSequence } from './game/Rules'

const REROLL_COST = 3
const BOSS_BONUS = 15

export class Game {
  private app: Application
  private root: Container
  private bgLayer: Container
  private boardLayer: Container
  private fxLayer: Container
  private uiLayer: Container
  private backgroundFX: BackgroundFX

  private board: Board
  private run: Run
  private inventory: Inventory
  private scoreEngine: ScoreEngine
  private boardView!: BoardView
  private hud!: HUD
  private stockPile!: StockPile
  private modal!: Modal
  private cashOut!: CashOutButton
  private insectSlots!: InsectSlots
  private scrollTray!: ScrollTray
  private potionTray!: PotionTray
  private shop!: Shop
  private helpModal!: HelpModal
  private settingsButton!: SettingsButton
  private characterSelect!: CharacterSelect
  private languageToggle!: LanguageToggle
  private soundToggle!: SoundToggle
  private tooltip!: Tooltip
  private bossBanner!: BossBanner
  private deckViewer!: DeckViewer
  private deckButton!: DeckButton
  private scoreBurst: ScoreBurst
  private kaCascade: KACascade

  private stepsLeft: number = 25
  private busy: boolean = false
  private levelEnded: boolean = false
  private activeScrollUid: string | null = null
  private dustPotionUid: string | null = null
  private shopItems: ShopItem[] = []

  constructor(app: Application) {
    this.app = app
    this.root = new Container()
    this.app.stage.addChild(this.root)

    this.bgLayer = new Container()
    this.boardLayer = new Container()
    this.fxLayer = new Container()
    this.uiLayer = new Container()
    this.root.addChild(this.bgLayer, this.boardLayer, this.fxLayer, this.uiLayer)

    this.backgroundFX = new BackgroundFX()
    this.bgLayer.addChild(this.backgroundFX)
    this.app.ticker.add((tk) => this.backgroundFX.update(tk.deltaTime))

    this.board = new Board()
    this.run = new Run()
    this.inventory = new Inventory()
    this.scoreEngine = new ScoreEngine()
    this.scoreEngine.setInventory(this.inventory)
    this.scoreEngine.setCoinsGetter(() => this.run.coins)

    this.scoreBurst = new ScoreBurst()
    this.fxLayer.addChild(this.scoreBurst)
    this.kaCascade = new KACascade()
    this.fxLayer.addChild(this.kaCascade)
  }

  start(): void {
    sound.init()
    window.addEventListener('pointerdown', () => {
      sound.resume()
      sound.startAmbient(this.run.isBossRound() ? 'boss' : 'normal')
    }, { once: true })

    this.boardView = new BoardView(this.board)
    this.boardLayer.addChild(this.boardView)
    this.boardView.onMoveAttempt = (a) => this.handleMove(a)
    this.boardView.onCardTargeted = (c) => this.handleCardTargeted(c)

    this.hud = new HUD()
    this.uiLayer.addChild(this.hud)

    this.insectSlots = new InsectSlots(5)
    this.insectSlots.onSellInsect = (uid) => this.handleSellInsect(uid)
    this.uiLayer.addChild(this.insectSlots)
    this.scrollTray = new ScrollTray(5)
    this.scrollTray.onScrollClick = (uid) => this.onScrollClicked(uid)
    this.uiLayer.addChild(this.scrollTray)
    this.potionTray = new PotionTray(2)
    this.potionTray.onPotionClick = (uid) => this.onPotionClicked(uid)
    this.uiLayer.addChild(this.potionTray)

    this.stockPile = new StockPile()
    this.stockPile.x = 40
    this.stockPile.y = GAME_HEIGHT - 220
    this.stockPile.onDeal = () => this.handleStockDeal()
    this.uiLayer.addChild(this.stockPile)

    this.cashOut = new CashOutButton()
    this.cashOut.x = GAME_WIDTH - 240
    this.cashOut.y = GAME_HEIGHT - 220
    this.cashOut.onClick = () => this.onCashOut()
    this.uiLayer.addChild(this.cashOut)

    this.settingsButton = new SettingsButton()
    this.settingsButton.x = GAME_WIDTH - 60
    this.settingsButton.y = 74
    this.settingsButton.onClick = () => { sound.playButton(); this.helpModal.open() }
    this.uiLayer.addChild(this.settingsButton)

    this.languageToggle = new LanguageToggle()
    this.languageToggle.x = GAME_WIDTH - 130
    this.languageToggle.y = 66
    this.uiLayer.addChild(this.languageToggle)

    this.soundToggle = new SoundToggle()
    this.soundToggle.x = GAME_WIDTH - 270
    this.soundToggle.y = 66
    this.uiLayer.addChild(this.soundToggle)

    this.deckButton = new DeckButton()
    this.deckButton.x = GAME_WIDTH - 350
    this.deckButton.y = 66
    this.deckButton.onClick = () => {
      sound.playButton()
      this.deckViewer.show(this.run.deckEnhancements, this.run.removedCardIds)
    }
    this.uiLayer.addChild(this.deckButton)

    this.shop = new Shop()
    this.shop.onBuy = (item) => this.tryBuy(item)
    this.shop.onReroll = () => this.tryReroll()
    this.shop.onNext = () => this.onShopNext()
    this.uiLayer.addChild(this.shop)

    this.modal = new Modal()
    this.uiLayer.addChild(this.modal)

    this.helpModal = new HelpModal()
    this.uiLayer.addChild(this.helpModal)

    this.bossBanner = new BossBanner()
    this.uiLayer.addChild(this.bossBanner)

    this.deckViewer = new DeckViewer()
    this.uiLayer.addChild(this.deckViewer)

    this.tooltip = new Tooltip()
    this.uiLayer.addChild(this.tooltip)

    this.characterSelect = new CharacterSelect()
    this.characterSelect.onPick = (id) => this.onCharacterPicked(id)
    this.uiLayer.addChild(this.characterSelect)

    const showTip = (text: string | null, x: number, y: number) => {
      if (text) this.tooltip.show(text, x, y)
      else this.tooltip.hide()
    }
    this.insectSlots.onHoverDescribe = showTip
    this.scrollTray.onHoverDescribe = showTip
    this.potionTray.onHoverDescribe = showTip
    this.deckButton.onHoverDescribe = showTip
    this.deckViewer.onHoverDescribe = showTip

    onLangChange(() => this.onLanguageChanged())

    // 角色选择：优先用 localStorage 上次选择，否则弹窗
    const savedChar = this.readSavedCharacter()
    if (savedChar) {
      this.applyCharacterToNewRun(savedChar)
    } else {
      // 给一张默认的启动套，避免空屏闪烁；但暂不发初始牌
      this.applyCharacterToNewRun('weaver')
      setTimeout(() => this.promptCharacterSelect(), 150)
    }

    this.stepsLeft = this.run.currentStepLimit
    this.refreshHud()
    this.dealInitialAnimation()
  }

  private readSavedCharacter(): CharacterId | null {
    try {
      const v = window.localStorage.getItem('webmaster_character')
      if (v === 'weaver' || v === 'hamster' || v === 'mantis_warrior') return v
    } catch { /* ignore */ }
    return null
  }

  private saveCharacter(id: CharacterId): void {
    try { window.localStorage.setItem('webmaster_character', id) } catch { /* ignore */ }
  }

  private applyCharacterToNewRun(id: CharacterId): void {
    this.run.setCharacter(id)
    const eff = this.run.character.effect
    const baseCap = 5
    this.inventory.reset()
    this.inventory.setInsectSlotCap(baseCap + (eff.extraInsectSlot ?? 0))
    // 起手套：起始虫 + 起手卷轴 + 起手药水（与之前行为保持一致）
    const startingInsectId = eff.startingInsectId ?? 'firefly'
    const starter = INSECT_CARDS[startingInsectId] ?? INSECT_CARDS.firefly
    this.inventory.addInsect(starter)
    this.inventory.addScroll(SCROLLS.silk_scroll)
    this.inventory.addPotion(POTIONS.time_honey)
    // 角色效果
    this.scoreEngine.setCharacterMoveChipsBonus(eff.moveChipsBonus ?? 0)
    this.saveCharacter(id)
  }

  private promptCharacterSelect(): void {
    this.characterSelect.show()
  }

  private async onCharacterPicked(id: CharacterId): Promise<void> {
    await this.characterSelect.hide()
    sound.playButton()
    // 重开一把，套用新角色
    this.run.reset(false)
    this.applyCharacterToNewRun(id)
    this.scoreEngine.resetForNextLevel()
    this.board.reset()
    this.boardView.rebuild()
    this.boardView.mode = 'drag'
    this.stepsLeft = this.run.currentStepLimit
    this.levelEnded = false
    this.refreshHud()
    this.hud.setLastPlay(0, 1)
    this.hud.setCombo(0, 1)
    this.dealInitialAnimation()
  }

  private onLanguageChanged(): void {
    this.hud.applyLang()
    this.stockPile.applyLang()
    this.cashOut.applyLang()
    this.modal.applyLang()
    this.shop.applyLang()
    this.helpModal.applyLang()
    this.insectSlots.applyLang()
    this.scrollTray.applyLang()
    this.potionTray.applyLang()
    this.deckViewer.applyLang()
  }

  private refreshHud(): void {
    this.hud.setAnte(this.run.ante + 1)
    this.hud.setTarget(this.run.currentTarget)
    this.hud.setScore(this.scoreEngine.getTotal())
    this.hud.setSteps(this.stepsLeft)
    this.hud.setCoins(this.run.coins)
    this.hud.setXMult(this.scoreEngine.getXMult())
    this.hud.setBoss(this.run.isBossRound())
    this.stockPile.setRoundsLeft(this.board.stockRoundsLeft())
    this.insectSlots.update(this.inventory.insects, this.inventory.foundation)
    this.scrollTray.update(this.inventory.scrolls)
    this.potionTray.update(this.inventory.potions)
    this.updateDeadlockWarning()
    this.updateCashOut()
  }

  private updateDeadlockWarning(): void {
    const canMove = this.board.hasLegalMove()
    this.stockPile.showWarning(!canMove && this.board.canDealStock())
  }

  private estimatedReward(): number {
    const base = COIN_REWARDS.CLEAR_BONUS + 5
    const clears = this.scoreEngine.getClearCount() * COIN_REWARDS.PER_CLEAR
    const steps = Math.max(0, this.stepsLeft) * COIN_REWARDS.PER_STEP_LEFT
    const interest = this.run.getInterestAmount()
    const boss = this.run.isBossRound() ? BOSS_BONUS : 0
    return base + clears + steps + interest + boss
  }

  private updateCashOut(): void {
    if (this.levelEnded) { this.cashOut.hide(); return }
    const reached = this.scoreEngine.getTotal() >= this.run.currentTarget
    if (reached) {
      this.cashOut.setReward(this.estimatedReward())
      this.cashOut.show()
    } else {
      this.cashOut.hide()
    }
  }

  private dealInitialAnimation(): void {
    let order = 0
    for (let col = 0; col < COLUMN_COUNT; col++) {
      const column = this.board.columns[col]
      for (let i = 0; i < column.length; i++) {
        const card = column[i]
        const sprite = this.boardView.getSprite(card)
        if (!sprite) continue
        const targetX = sprite.homeX
        const targetY = sprite.homeY
        sprite.position.set(GAME_WIDTH / 2, -100)
        sprite.alpha = 0
        gsap.to(sprite, {
          x: targetX,
          y: targetY,
          alpha: 1,
          duration: 0.35,
          ease: 'back.out(1.5)',
          delay: order * 0.012
        })
        order++
      }
    }
  }

  private async handleMove(attempt: MoveAttempt): Promise<boolean> {
    if (this.busy || this.levelEnded) return false
    if (this.stepsLeft <= 0) return false

    const result = this.board.tryMove(attempt.fromCol, attempt.fromIdx, attempt.toCol)
    if (!result) return false

    sound.playMove()
    this.busy = true
    this.stepsLeft--
    this.hud.setSteps(this.stepsLeft)

    this.boardView.layout(false)

    if (result.flippedCard) {
      const flipSprite = this.boardView.getSprite(result.flippedCard)
      if (flipSprite) {
        await new Promise(r => setTimeout(r, 120))
        sound.playFlip()
        await flipSprite.playFlipFromBack()
      }
    }

    const breakdown = this.scoreEngine.scoreMove(result, this.board.emptyColumnCount())

    if (breakdown.coinBonus > 0) {
      this.run.coins += breakdown.coinBonus
      this.hud.setCoins(this.run.coins)
      sound.playCoin()
    }
    if (breakdown.stepRefund > 0) {
      this.stepsLeft += breakdown.stepRefund
      this.hud.setSteps(this.stepsLeft)
    }

    this.hud.setLastPlay(breakdown.chips, breakdown.mult * breakdown.comboMult * breakdown.xmult)
    this.hud.setCombo(this.scoreEngine.getComboStreak(), breakdown.comboMult)
    this.hud.setXMult(this.scoreEngine.getXMult())

    const streak = this.scoreEngine.getComboStreak()
    if (streak >= 3) sound.playCombo(streak)

    if (result.cleared) {
      const sprites = this.boardView.detachCards(result.cleared.cards)
      sprites.forEach(s => {
        const world = s.getGlobalPosition()
        const local = this.kaCascade.toLocal(world)
        s.position.set(local.x, local.y)
        this.kaCascade.addChild(s)
      })

      if (result.cleared.isFullKA) sound.playBigClear()
      else sound.playClear()

      screenShake(this.boardLayer, result.cleared.isFullKA ? 20 : 11, 0.5)
      if (result.cleared.isFullKA) screenShake(this.uiLayer, 10, 0.45)
      await this.kaCascade.play(sprites)
    }

    const intensity = Math.min(24, 4 + Math.log10(Math.max(10, breakdown.total)) * 3)
    screenShake(this.boardLayer, intensity, 0.35)

    const totalMult = breakdown.mult * breakdown.comboMult * breakdown.xmult
    const isBigEvent = !!result.cleared || breakdown.total >= 500
    if (isBigEvent) {
      this.scoreBurst.playFull(breakdown.chips, totalMult, breakdown.total)
    } else {
      const target = this.board.columns[attempt.toCol]
      const cardsInCol = Math.max(1, target.length)
      const popupX = COLUMN_START_X + attempt.toCol * COLUMN_GAP + CARD_WIDTH / 2
      const popupY = COLUMN_Y + Math.min(cardsInCol - 1, 6) * 26 + CARD_HEIGHT * 0.35
      this.scoreBurst.playCompact(breakdown.total, popupX, popupY, this.scoreEngine.getComboStreak())
    }

    this.hud.setScore(this.scoreEngine.getTotal())
    this.stockPile.setRoundsLeft(this.board.stockRoundsLeft())
    this.updateDeadlockWarning()
    this.updateCashOut()

    this.busy = false
    this.checkLevelEnd()
    return true
  }

  private async handleStockDeal(): Promise<void> {
    if (this.busy || this.levelEnded) return
    if (!this.board.canDealStock()) {
      sound.playReject()
      this.stockPile.pulseReject()
      return
    }
    if (this.stepsLeft <= 0) return

    this.busy = true
    this.stepsLeft--
    this.hud.setSteps(this.stepsLeft)
    this.scoreEngine.onStockDeal()
    this.hud.setCombo(0, 1)

    const deal = this.board.dealStock()
    if (!deal) { this.busy = false; return }
    this.boardView.syncSprites()
    this.boardView.layout(true)

    const originX = this.stockPile.x + CARD_WIDTH / 2
    const originY = this.stockPile.y + 30
    const flights: Promise<void>[] = []
    for (let i = 0; i < deal.perColumn.length; i++) {
      const { card } = deal.perColumn[i]
      const sprite = this.boardView.getSprite(card)
      if (!sprite) continue
      const tgtX = sprite.homeX
      const tgtY = sprite.homeY
      sprite.position.set(originX, originY)
      sprite.card.faceUp = false
      sprite.redraw()
      flights.push(new Promise<void>((resolve) => {
        gsap.to(sprite, {
          x: tgtX,
          y: tgtY,
          duration: 0.4,
          delay: i * 0.04,
          ease: 'power2.out',
          onComplete: async () => {
            sound.playFlip()
            await sprite.playFlipFromBack()
            resolve()
          }
        })
      }))
    }
    await Promise.all(flights)

    this.stockPile.setRoundsLeft(this.board.stockRoundsLeft())
    this.updateDeadlockWarning()
    this.updateCashOut()

    this.busy = false
    this.checkLevelEnd()
  }

  private onScrollClicked(uid: string): void {
    if (this.busy || this.levelEnded) return
    if (this.dustPotionUid) this.cancelDustMode()
    if (this.activeScrollUid === uid) {
      this.cancelScrollMode()
      return
    }
    this.activeScrollUid = uid
    this.boardView.mode = 'target'
    this.scrollTray.setActive(uid)
    const scroll = this.inventory.scrolls.find(s => s.uid === uid)
    if (scroll) {
      this.tooltip.show(
        t('scroll_target_hint', { name: t(`scroll.${scroll.def.id}.name`) }),
        GAME_WIDTH / 2, 220
      )
    }
  }

  private cancelScrollMode(): void {
    this.activeScrollUid = null
    this.boardView.mode = 'drag'
    this.scrollTray.setActive(null)
    this.tooltip.hide()
  }

  private enterDustMode(uid: string): void {
    if (this.activeScrollUid) this.cancelScrollMode()
    this.dustPotionUid = uid
    this.boardView.mode = 'target'
    this.tooltip.show(t('dust_target_hint'), GAME_WIDTH / 2, 220)
  }

  private cancelDustMode(): void {
    this.dustPotionUid = null
    this.boardView.mode = 'drag'
    this.tooltip.hide()
  }

  private handleCardTargeted(card: Card): void {
    if (this.dustPotionUid) {
      void this.applyDust(card)
      return
    }
    if (!this.activeScrollUid) return
    const scroll = this.inventory.scrolls.find(s => s.uid === this.activeScrollUid)
    if (!scroll) { this.cancelScrollMode(); return }
    card.enhancement = scroll.def.enhancement
    this.run.deckEnhancements.set(card.id, scroll.def.enhancement)
    const sprite = this.boardView.getSprite(card)
    if (sprite) {
      sprite.redraw()
      gsap.fromTo(sprite.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' })
    }
    this.inventory.removeScroll(this.activeScrollUid)
    this.scoreEngine.onScrollUsed()
    this.cancelScrollMode()
    this.scrollTray.update(this.inventory.scrolls)
    sound.playScroll()
  }

  private async applyDust(card: Card): Promise<void> {
    if (!this.dustPotionUid) return
    const potionUid = this.dustPotionUid
    // Find card in board columns and remove
    let found = false
    for (const col of this.board.columns) {
      const idx = col.indexOf(card)
      if (idx !== -1) {
        col.splice(idx, 1)
        // If this card was the top face-up card and there's a face-down card beneath, flip it
        if (idx === col.length && col.length > 0) {
          const newTop = col[col.length - 1]
          if (!newTop.faceUp) {
            newTop.faceUp = true
            const s = this.boardView.getSprite(newTop)
            if (s) {
              s.card.faceUp = false
              void s.playFlipFromBack()
            }
          }
        }
        found = true
        break
      }
    }
    if (!found) return
    this.run.removedCardIds.add(card.id)

    const sprite = this.boardView.getSprite(card)
    if (sprite) {
      gsap.to(sprite.scale, { x: 1.4, y: 1.4, duration: 0.35, ease: 'power2.out' })
      gsap.to(sprite, { alpha: 0, duration: 0.35, onComplete: () => { sprite.parent?.removeChild(sprite) } })
    }

    this.inventory.removePotion(potionUid)
    this.cancelDustMode()
    sound.playPotion()
    this.potionTray.update(this.inventory.potions)
    this.boardView.layout(false)
    this.refreshHud()
    this.checkLevelEnd()
  }

  private onPotionClicked(uid: string): void {
    if (this.busy || this.levelEnded) return
    if (this.dustPotionUid === uid) {
      this.cancelDustMode()
      return
    }
    const potion = this.inventory.potions.find(p => p.uid === uid)
    if (!potion) return
    this.executePotion(potion.uid, potion.def.effect)
  }

  private async executePotion(uid: string, effect: string): Promise<void> {
    if (effect === 'dust') {
      this.enterDustMode(uid)
      sound.playButton()
      return
    }
    sound.playPotion()
    switch (effect) {
      case 'time_honey':
        this.stepsLeft += 5
        this.hud.setSteps(this.stepsLeft)
        break
      case 'gold_rain':
        this.run.coins += 10
        this.hud.setCoins(this.run.coins)
        sound.playCoin()
        break
      case 'combo_primer':
        this.scoreEngine.bumpCombo(3)
        this.hud.setCombo(this.scoreEngine.getComboStreak(), Math.pow(1.5, Math.max(0, this.scoreEngine.getComboStreak() - 2)))
        break
      case 'burst_surge':
        this.scoreEngine.queueScoreMult(3)
        break
      case 'seers_eye': {
        const faceDown: Card[] = []
        for (const col of this.board.columns) for (const c of col) if (!c.faceUp) faceDown.push(c)
        for (let i = faceDown.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[faceDown[i], faceDown[j]] = [faceDown[j], faceDown[i]]
        }
        const toReveal = faceDown.slice(0, 3)
        for (const card of toReveal) {
          card.faceUp = true
          const sprite = this.boardView.getSprite(card)
          if (sprite) {
            sprite.card.faceUp = false
            await sprite.playFlipFromBack()
          }
        }
        break
      }
      case 'emergency_clear': {
        let best: { col: number; start: number; cards: Card[] } | null = null
        for (let ci = 0; ci < this.board.columns.length; ci++) {
          const col = this.board.columns[ci]
          const seq = checkClearableSequence(col, 3)
          if (seq && (!best || seq.cards.length > best.cards.length)) {
            best = { col: ci, start: seq.start, cards: seq.cards }
          }
        }
        if (best) {
          const target = this.board.columns[best.col]
          const removed = target.splice(best.start, best.cards.length)
          this.board.collected.push(removed)
          this.board.clearCount++
          if (target.length > 0 && !target[target.length - 1].faceUp) {
            target[target.length - 1].faceUp = true
          }
          const sprites = this.boardView.detachCards(removed)
          sprites.forEach(s => {
            const world = s.getGlobalPosition()
            const local = this.kaCascade.toLocal(world)
            s.position.set(local.x, local.y)
            this.kaCascade.addChild(s)
          })
          sound.playBigClear()
          screenShake(this.boardLayer, 16, 0.5)
          await this.kaCascade.play(sprites)
          this.boardView.layout(false)
        }
        break
      }
      case 'reshuffle': {
        const stock = this.board.stock
        for (let i = stock.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[stock[i], stock[j]] = [stock[j], stock[i]]
        }
        break
      }
    }

    this.inventory.removePotion(uid)
    this.potionTray.update(this.inventory.potions)
    this.refreshHud()
    this.checkLevelEnd()
  }

  private tryBuy(item: ShopItem): boolean {
    if (this.run.coins < item.price) return false
    if (item.kind === 'insect' && !this.inventory.canAddInsect()) return false
    if (item.kind === 'scroll' && !this.inventory.canAddScroll()) return false
    if (item.kind === 'potion' && !this.inventory.canAddPotion()) return false
    this.run.coins -= item.price
    if (item.kind === 'insect') this.inventory.addInsect(item.insectDef!)
    else if (item.kind === 'scroll') this.inventory.addScroll(item.scrollDef!)
    else this.inventory.addPotion(item.potionDef!)
    this.shop.setCoinBalance(this.run.coins)
    this.insectSlots.update(this.inventory.insects, this.inventory.foundation)
    this.scrollTray.update(this.inventory.scrolls)
    this.potionTray.update(this.inventory.potions)
    sound.playCoin()
    return true
  }

  private tryReroll(): void {
    if (this.run.coins < REROLL_COST) return
    this.run.coins -= REROLL_COST
    this.shop.setCoinBalance(this.run.coins)
    this.shopItems = rollShopItems()
    this.shop.setItems(this.shopItems)
    sound.playButton()
  }

  private async onShopNext(): Promise<void> {
    sound.playButton()
    await this.shop.hide()
    this.prepareLevel()
  }

  private checkLevelEnd(): void {
    if (this.levelEnded) return
    const score = this.scoreEngine.getTotal()
    const reachedTarget = score >= this.run.currentTarget
    const outOfSteps = this.stepsLeft <= 0
    const deadlocked = this.board.isDeadlocked()

    if ((outOfSteps || deadlocked) && reachedTarget) this.endLevelWin()
    else if ((outOfSteps || deadlocked) && !reachedTarget) this.endLevelLose()
  }

  private onCashOut(): void {
    if (this.levelEnded) return
    if (this.scoreEngine.getTotal() < this.run.currentTarget) return
    sound.playCashOut()
    this.endLevelWin()
  }

  private endLevelWin(): void {
    this.levelEnded = true
    this.cashOut.hide()
    const wasBoss = this.run.isBossRound()
    const defeatedBoss = wasBoss ? this.run.currentBoss : null
    const clearCount = this.scoreEngine.getClearCount()
    const base = COIN_REWARDS.CLEAR_BONUS + 5
    const clearBonus = clearCount * COIN_REWARDS.PER_CLEAR
    const stepBonus = Math.max(0, this.stepsLeft) * COIN_REWARDS.PER_STEP_LEFT
    const interest = this.run.getInterestAmount()
    const bossBonus = wasBoss ? BOSS_BONUS : 0
    const totalReward = base + clearBonus + stepBonus + interest + bossBonus
    this.run.coins += totalReward

    if (wasBoss && this.inventory.canAddInsect()) {
      const rare = rollRandomInsect(3, 5)
      this.inventory.addInsect(rare)
    }

    // 击败 Hoarder 后下家商店涨价
    if (defeatedBoss?.effect.shopMarkup) {
      this.run.nextShopMarkup = defeatedBoss.effect.shopMarkup
    }

    this.run.advance()
    sound.playWin()

    if (this.run.isCampaignComplete()) {
      setTimeout(() => {
        this.modal.show(
          'campaign',
          { score: this.scoreEngine.getTotal(), target: this.run.currentTarget },
          () => this.restartRun()
        )
      }, 600)
      return
    }

    setTimeout(() => {
      this.openShop(totalReward, { base, clears: clearBonus, steps: stepBonus, interest, bossBonus })
    }, 600)
  }

  private openShop(totalReward: number, breakdown: { base: number; clears: number; steps: number; interest: number; bossBonus: number }): void {
    // 每次进商店意味着又完成一关，更新昆虫持有轮数和售价
    this.inventory.advanceRound()
    this.insectSlots.update(this.inventory.insects, this.inventory.foundation)
    this.shopItems = rollShopItems()
    // 应用上一轮 boss 遗留的涨价 markup
    const markup = this.run.nextShopMarkup
    if (markup !== 1) {
      for (const item of this.shopItems) item.price = Math.max(1, Math.ceil(item.price * markup))
    }
    this.run.nextShopMarkup = 1
    this.shop.setItems(this.shopItems)
    this.shop.setCoinBalance(this.run.coins)
    this.shop.setRewardInfo({
      round: this.run.ante,
      total: totalReward,
      base: breakdown.base,
      clears: breakdown.clears,
      steps: breakdown.steps,
      interest: breakdown.interest
    })
    this.shop.show()
  }

  private handleSellInsect(uid: string): void {
    if (this.levelEnded && !this.shop.visible) return
    const ins = this.inventory.findInsect(uid)
    if (!ins) return
    const mult = this.run.character.effect.sellPriceMult ?? 1
    const price = Math.max(1, Math.ceil(this.inventory.getSellPrice(uid) * mult))
    this.inventory.removeInsect(uid)
    this.run.coins += price
    sound.playCoin()
    this.insectSlots.update(this.inventory.insects, this.inventory.foundation)
    this.hud.setCoins(this.run.coins)
    if (this.shop.visible) this.shop.setCoinBalance(this.run.coins)
  }

  private endLevelLose(): void {
    this.levelEnded = true
    this.cashOut.hide()
    sound.playLose()
    setTimeout(() => {
      this.modal.show(
        'lose',
        { score: this.scoreEngine.getTotal(), target: this.run.currentTarget },
        () => this.restartRun()
      )
    }, 500)
  }

  private async restartRun(): Promise<void> {
    await this.modal.hide()
    // 保留当前角色，重置 run（金币、ante）并重新发起手套
    this.run.reset(true)
    this.applyCharacterToNewRun(this.run.characterId)
    this.prepareLevel()
  }

  private async prepareLevel(): Promise<void> {
    this.levelEnded = false
    this.stepsLeft = this.run.currentStepLimit
    this.scoreEngine.resetForNextLevel()

    const boss = this.run.currentBoss
    this.scoreEngine.setClearChipsPenalty(boss?.effect.clearChipsPenalty ?? 1)

    const enhancementsToApply = boss?.effect.noEnhancementReveal
      ? new Map()
      : this.run.deckEnhancements

    this.board.reset(undefined, {
      enhancements: enhancementsToApply,
      removedIds: this.run.removedCardIds
    })
    this.boardView.rebuild()
    this.boardView.mode = 'drag'
    this.activeScrollUid = null
    this.dustPotionUid = null
    this.scrollTray.setActive(null)
    this.refreshHud()
    this.hud.setLastPlay(0, 1)
    this.hud.setCombo(0, 1)
    this.dealInitialAnimation()

    if (this.run.isBossRound()) {
      sound.startAmbient('boss')
      sound.playBoss()
      await this.bossBanner.play(boss)
    } else {
      sound.startAmbient('normal')
    }
  }
}
