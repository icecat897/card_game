export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 800

export const CARD_WIDTH = 82
export const CARD_HEIGHT = 116
export const CARD_STACK_OFFSET_OPEN = 28
export const CARD_STACK_OFFSET_CLOSED = 10

export const COLUMN_COUNT = 10
export const COLUMN_START_X = 70
export const COLUMN_GAP = 115
export const COLUMN_Y = 205

export const TRAY_Y = 128
export const TRAY_HEIGHT = 68

export const COLORS = {
  bg: 0x0a0612,
  cardBack: 0x3a2155,
  cardBackEdge: 0x6a4a9a,
  cardBackWeb: 0x8a6fbf,
  cardFront: 0xf4ecd8,
  cardFrontEdge: 0x3a2155,
  accent: 0xa88fd0,
  chipBlue: 0x8ecfff,
  multRed: 0xff7a85,
  xmultPurple: 0xd48aff,
  gold: 0xffecc4,
  textDim: 0x8a7aa8,
  danger: 0xff6a6a
} as const

export const ANIM = {
  CARD_MOVE: 0.22,
  CARD_FLIP: 0.35,
  KA_PER_CARD: 0.05,
  SCORE_BURST_TOTAL: 1.2
} as const

export const SCORING = {
  CHIPS_PER_MOVE: 5,
  CHIPS_PER_FLIP: 10,
  CHIPS_EMPTY_COLUMN: 20,
  CHIPS_CLEAR_BASE: 60,
  CHIPS_KA_BONUS: 130,
  MULT_PER_CLEAR: 3,
  MULT_PER_KA_BONUS: 5,
  MULT_PER_EMPTY_COLUMN: 1,
  MULT_ON_FLIP: 2,
  COMBO_MIN: 3,
  COMBO_MULT_BASE: 1.5,
  KA_XMULT_BONUS: 0.2,
  SEQUENCE_MIN_TO_CLEAR: 7
} as const

export const STEP_LIMIT_DEFAULT = 25
export const STOCK_DEAL_ROUNDS = 5

/** Ante 目标分（Small 关的简化版，后续扩展 Big/Boss） */
export const ANTE_TARGETS: readonly number[] = [
  300, 500, 900, 1600, 2800, 5000, 9000, 16000
]

export const COIN_REWARDS = {
  CLEAR_BONUS: 5,
  PER_CLEAR: 3,
  PER_STEP_LEFT: 1,
  INTEREST_PER_5: 1,
  INTEREST_CAP: 5
} as const
