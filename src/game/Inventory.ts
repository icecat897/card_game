import type { InsectCardDef } from './InsectCard'
import type { ScrollDef } from './Scroll'
import type { PotionDef } from './Potion'

export interface InsectInstance {
  uid: string
  def: InsectCardDef
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
  scrolls: ScrollInstance[] = []
  potions: PotionInstance[] = []

  insectSlotCap: number = 3
  scrollCap: number = 5
  potionCap: number = 2

  canAddInsect(): boolean { return this.insects.length < this.insectSlotCap }
  canAddScroll(): boolean { return this.scrolls.length < this.scrollCap }
  canAddPotion(): boolean { return this.potions.length < this.potionCap }

  addInsect(def: InsectCardDef): InsectInstance | null {
    if (!this.canAddInsect()) return null
    const inst: InsectInstance = { uid: nextUid('insect'), def }
    this.insects.push(inst)
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
    const i = this.insects.findIndex(s => s.uid === uid)
    if (i === -1) return false
    this.insects.splice(i, 1)
    return true
  }

  reset(): void {
    this.insects = []
    this.scrolls = []
    this.potions = []
  }
}
