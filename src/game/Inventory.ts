import type { InsectCardDef } from './InsectCard'
import type { ScrollDef } from './Scroll'
import type { PotionDef } from './Potion'

export interface InsectInstance {
  uid: string
  def: InsectCardDef
  /** 持有的关卡数（每次离开商店 +1）；部分昆虫会用来计算售价 */
  roundsHeld: number
  /** 当前出售价格（可随时间增长） */
  sellPrice: number
}

export interface ScrollInstance {
  uid: string
  def: ScrollDef
}

export interface PotionInstance {
  uid: string
  def: PotionDef
}

let uidCounter = 0
function nextUid(prefix: string): string {
  return `${prefix}-${++uidCounter}`
}

export class Inventory {
  insects: InsectInstance[] = []
  /** 基座槽（如螃蟹），不占常规位置；最多 1 张 */
  foundation: InsectInstance | null = null
  scrolls: ScrollInstance[] = []
  potions: PotionInstance[] = []

  insectSlotCap: number = 5
  scrollCap: number = 5
  potionCap: number = 2

  canAddInsect(def?: InsectCardDef): boolean {
    if (def?.isFoundation) return this.foundation === null
    return this.insects.length < this.insectSlotCap
  }
  canAddScroll(): boolean { return this.scrolls.length < this.scrollCap }
  canAddPotion(): boolean { return this.potions.length < this.potionCap }

  addInsect(def: InsectCardDef): InsectInstance | null {
    if (!this.canAddInsect(def)) return null
    const inst: InsectInstance = {
      uid: nextUid('insect'),
      def,
      roundsHeld: 0,
      sellPrice: Math.max(1, Math.ceil(def.price / 2))
    }
    if (def.isFoundation) this.foundation = inst
    else this.insects.push(inst)
    return inst
  }

  addScroll(def: ScrollDef): ScrollInstance | null {
    if (!this.canAddScroll()) return null
    const inst: ScrollInstance = { uid: nextUid('scroll'), def }
    this.scrolls.push(inst)
    return inst
  }

  addPotion(def: PotionDef): PotionInstance | null {
    if (!this.canAddPotion()) return null
    const inst: PotionInstance = { uid: nextUid('potion'), def }
    this.potions.push(inst)
    return inst
  }

  removeScroll(uid: string): boolean {
    const i = this.scrolls.findIndex(s => s.uid === uid)
    if (i === -1) return false
    this.scrolls.splice(i, 1)
    return true
  }

  removePotion(uid: string): boolean {
    const i = this.potions.findIndex(s => s.uid === uid)
    if (i === -1) return false
    this.potions.splice(i, 1)
    return true
  }

  removeInsect(uid: string): boolean {
    if (this.foundation?.uid === uid) {
      this.foundation = null
      return true
    }
    const i = this.insects.findIndex(s => s.uid === uid)
    if (i === -1) return false
    this.insects.splice(i, 1)
    return true
  }

  findInsect(uid: string): InsectInstance | null {
    if (this.foundation?.uid === uid) return this.foundation
    return this.insects.find(s => s.uid === uid) ?? null
  }

  /** 参与计分的所有昆虫（含 foundation） */
  allActiveInsects(): InsectInstance[] {
    const list = [...this.insects]
    if (this.foundation) list.push(this.foundation)
    return list
  }

  /** 关卡结束 / 下轮开始时调用：更新持有轮数和售价 */
  advanceRound(): void {
    const touch = (ins: InsectInstance): void => {
      ins.roundsHeld++
      const growth = ins.def.sellPriceGrowth ?? 0
      ins.sellPrice += growth
    }
    for (const ins of this.insects) touch(ins)
    if (this.foundation) touch(this.foundation)
  }

  getSellPrice(uid: string): number {
    return this.findInsect(uid)?.sellPrice ?? 0
  }

  setInsectSlotCap(cap: number): void {
    this.insectSlotCap = cap
  }

  reset(): void {
    this.insects = []
    this.foundation = null
    this.scrolls = []
    this.potions = []
    this.insectSlotCap = 5
  }
}
