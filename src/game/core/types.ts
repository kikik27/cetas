// Shared types used across all layers

export type GamePhase = 'prep' | 'battle'

export interface FloatText {
  txt: string
  rise: number
  life: number
  color: string
}

export type UnitAnimState = 'idle' | 'run' | 'attack' | 'hurt' | 'death'

/** A live unit instance on the board or bench */
export interface Unit {
  uid: number
  id: string
  name: string
  cost: number
  stars: number
  enemy: boolean
  trait: string
  spriteType: string
  avatarIndex: string
  traitLabel: string
  maxHp: number
  curHp: number
  atkVal: number
  spd: number
  attackRange: number
  moveSpd: number
  moveTimer: number
  /** Sub-cell visual position for smooth movement interpolation (0–1 within cell) */
  visualX: number
  visualY: number
  /** Target cell for interpolation */
  targetRow: number
  targetCol: number
  color: string
  accent: string
  body: number[][]
  animState: UnitAnimState
  animFrame: number
  animElapsed: number
  animDone: boolean
  anim: number
  animDir: number
  shake: number
  attackTimer: number
  dead: boolean
  floats: FloatText[]
  /** Which horizontal direction the unit is currently facing */
  facingLeft: boolean
}

/** Flying arrow projectile */
export interface Projectile {
  id: number
  /** Pixel start position */
  x: number
  y: number
  /** Pixel target position */
  tx: number
  ty: number
  /** 0–1 progress */
  progress: number
  /** pixels per second */
  speed: number
  team: 'blue' | 'red'
}

export interface GridPosition {
  row: number
  col: number
}

export type BoardGrid = (Unit | null)[][]
export type BenchSlots = (Unit | null)[]

export interface ShopItem {
  id: string
  name: string
  cost: number
  atk: number
  hp: number
  spd: number
  color: string
  accent: string
  trait: string
  traitLabel: string
  spriteType: string
  avatarIndex: string
  body: number[][]
  sold: boolean
}

/** Lightweight enemy preview for the intel panel — no animation state */
export interface EnemyPreview {
  id: string
  name: string
  stars: 1 | 2 | 3
  atk: number
  hp: number
  spd: number
  avatarIndex: string
  traitLabel: string
}

export interface BattleSummary {
  win: boolean
  goldEarned: number
  hpLost: number
  slotsGained: number
  aliveCount: number
  enemiesAlive: number
}

export interface StageRewardState {
  status: 'idle' | 'pending' | 'confirmed' | 'failed' | 'skipped'
  cetas: number
  xp: number
  txHashes: string[]
  error: string | null
}

export type SelectedSource =
  | { src: 'board'; r: number; c: number }
  | { src: 'bench'; idx: number }
  | null

export interface GameState {
  round: number
  hp: number
  gold: number
  phase: GamePhase
  maxBoardSlots: number
  rerollsLeft: number
  board: BoardGrid
  bench: BenchSlots
  shop: ShopItem[]
  selected: SelectedSource
  battleRunning: boolean
  battleTimeMs: number
  speedUp: boolean
  enemyPreview: EnemyPreview[]
  formationBoard: BoardGrid | null
  lastBattleResult: BattleSummary | null
  stageReward: StageRewardState
  /** Active arrow projectiles */
  projectiles: Projectile[]
  log: string[]
}
