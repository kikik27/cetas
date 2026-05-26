/**
 * Game balance constants — all tunable values in one place.
 * Change here, affects everywhere.
 */

// ── Phases ────────────────────────────────────────────────────────────────────
export const PHASE = {
  PREP:   'prep',
  BATTLE: 'battle',
} as const

// ── Teams ─────────────────────────────────────────────────────────────────────
export const TEAM = {
  BLUE: 'blue',
  RED:  'red',
} as const

// ── Animation states ──────────────────────────────────────────────────────────
export const ANIM = {
  IDLE:   'idle',
  RUN:    'run',
  ATTACK: 'attack',
  HURT:   'hurt',
} as const

// ── Selection sources ─────────────────────────────────────────────────────────
export const SEL_SRC = {
  BENCH: 'bench',
  BOARD: 'board',
} as const

// ── Battle ────────────────────────────────────────────────────────────────────
export const BATTLE_LIMIT_MS   = 30_000   // max battle duration
export const SPEED_UP_FACTOR   = 3        // 3× speed multiplier
export const BATTLE_TICK_CAP   = 100      // max delta ms per tick

// ── Unit stats ────────────────────────────────────────────────────────────────
export const STAR2_MULTIPLIER  = 1.8      // stat multiplier for 2-star unit
export const STAR3_MULTIPLIER  = 3.2      // stat multiplier for 3-star unit
export const MERGE_COUNT       = 3        // units needed to merge

// ── Combat ────────────────────────────────────────────────────────────────────
export const ARROW_SPEED_PX    = 600      // pixels per second
export const MOVE_SPEED_PX     = 75       // pixels per second
export const FLOAT_TEXT_TTL    = 20       // ticks before float text fades
export const ENEMY_STAR2_PROB  = 0.35     // probability enemy spawns as 2-star

// ── Economy ───────────────────────────────────────────────────────────────────
export const REROLL_COST       = 2        // gold cost to reroll shop
export const SELL_REFUND       = 1        // gold refunded when selling a unit
export const WIN_GOLD_BONUS    = 3        // extra gold for winning a round

// ── Board ─────────────────────────────────────────────────────────────────────
export const BOARD_COLS        = 8
export const BOARD_ROWS        = 4
export const BENCH_SIZE        = 8
export const MAX_ROUNDS        = 5
