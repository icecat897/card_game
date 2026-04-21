export type PotionEffect =
  | 'time_honey'       // +5 steps
  | 'gold_rain'        // +$10
  | 'combo_primer'     // combo streak +3
  | 'burst_surge'      // next score x3
  | 'seers_eye'        // flip 3 random face-down cards
  | 'emergency_clear'  // force-clear longest same-suit run at any column bottom (>=3)
  | 'reshuffle'        // shuffle stock pile
  | 'jump_web'         // duplicate a face-up card to empty column (simplified: nope, skip)

export interface PotionDef {
  id: string
  name: string
  description: string
  effect: PotionEffect
  price: number
  rarity: 1 | 2 | 3
  glyph: string
  color: number
}

export const POTIONS: Record<string, PotionDef> = {
  time_honey: {
    id: 'time_honey',
    name: 'Time Honey',
    description: '+5 Steps.',
    effect: 'time_honey',
    price: 4,
    rarity: 1,
    glyph: 'T',
    color: 0xffb366
  },
  gold_rain: {
    id: 'gold_rain',
    name: 'Gold Rain',
    description: '+$10 instantly.',
    effect: 'gold_rain',
    price: 5,
    rarity: 2,
    glyph: '$',
    color: 0xffd700
  },
  combo_primer: {
    id: 'combo_primer',
    name: 'Combo Primer',
    description: 'Combo streak +3 (immediately activates x1.5 or more).',
    effect: 'combo_primer',
    price: 5,
    rarity: 2,
    glyph: 'C',
    color: 0xc066ff
  },
  burst_surge: {
    id: 'burst_surge',
    name: 'Burst Surge',
    description: 'Your next move score x3.',
    effect: 'burst_surge',
    price: 6,
    rarity: 2,
    glyph: 'B',
    color: 0xff5a5f
  },
  seers_eye: {
    id: 'seers_eye',
    name: "Seer's Eye",
    description: 'Reveal 3 random face-down cards.',
    effect: 'seers_eye',
    price: 4,
    rarity: 1,
    glyph: 'E',
    color: 0x88d0ff
  },
  emergency_clear: {
    id: 'emergency_clear',
    name: 'Emergency Clear',
    description: 'Force-clear the longest same-suit run at any column bottom (min 3 cards).',
    effect: 'emergency_clear',
    price: 7,
    rarity: 3,
    glyph: 'X',
    color: 0x9a7fff
  },
  reshuffle: {
    id: 'reshuffle',
    name: 'Reshuffle',
    description: 'Reshuffle the stock pile.',
    effect: 'reshuffle',
    price: 3,
    rarity: 1,
    glyph: 'S',
    color: 0x7fdcb1
  }
}

export type PotionId = keyof typeof POTIONS
