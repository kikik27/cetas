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
export const STARTING_GOLD     = 4        // tighter endless-mode opening economy
export const MAX_GOLD          = 15       // prevents late-game runaway banking
export const STAGE_INCOME      = 3        // baseline gold gained between stages
export const WIN_GOLD_BONUS    = 2        // extra gold for winning a stage
export const LOSS_GOLD_REWARD  = 1        // small retry reward after defeat
export const REROLLS_PER_STAGE = 3        // limited shop refreshes per prep phase
export const ENDLESS_STAGE_POINT_REWARD = 120  // dummy points until on-chain rewards are ready
export const ENDLESS_STAGE_RANK_WEIGHT  = 1_000 // leaderboard prioritizes stage depth

// ── Board ─────────────────────────────────────────────────────────────────────
export const BOARD_COLS        = 8
export const BOARD_ROWS        = 4
export const BENCH_SIZE        = 8
export const INITIAL_STAGE     = 1
export const INITIAL_BOARD_SLOTS = 3
export const MAX_BOARD_SLOTS   = 8        // mobile-readable cap for active troops
