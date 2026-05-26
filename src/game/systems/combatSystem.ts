// Combat simulation — pure logic, no rendering
import { UNIT_DEFS } from '../entities/unitDefs'
import { makeUnit } from '../core/unitFactory'
import type { BoardGrid, Unit, EnemyPreview } from '../core/types'
import { COLS, ROWS, getAllUnits } from './boardSystem'
import {
  ARROW_SPEED_PX,
  FLOAT_TEXT_TTL,
  ENEMY_STAR2_PROB,
  STAR2_MULTIPLIER,
  WIN_GOLD_BONUS,
} from '../constants'

// ─── Enemy generation ─────────────────────────────────────────────────────────

export function generateEnemyPreview(round: number, maxBoardSlots: number): EnemyPreview[] {
  const maxEnemy = Math.min(maxBoardSlots + 2, 12)
  const count = Math.min(2 + round, maxEnemy)
  const tier = Math.min(Math.floor(round / 2), 2)
  const pool = UNIT_DEFS.filter(u => u.cost <= 1 + tier)
  const previews: EnemyPreview[] = []
  for (let i = 0; i < count; i++) {
    const def = pool[i % pool.length]
    const stars: 1 | 2 = round >= 4 && i % 3 === 0 ? 2 : 1
    const m = stars === 2 ? STAR2_MULTIPLIER : 1
    previews.push({
      id: def.id, name: def.name, stars,
      atk: Math.round(def.atk * m), hp: Math.round(def.hp * m), spd: def.spd,
      avatarIndex: def.avatarIndex, traitLabel: def.traitLabel,
    })
  }
  return previews
}

export function generateEnemies(board: BoardGrid, round: number, maxBoardSlots: number): BoardGrid {
  const b: BoardGrid = board.map(row => [...row])
  for (let r = 0; r < 4; r++) for (let c = 0; c < COLS; c++) b[r][c] = null

  const maxEnemy = Math.min(maxBoardSlots + 2, 12)
  const count = Math.min(2 + round, maxEnemy)
  const tier = Math.min(Math.floor(round / 2), 2)
  const pool = UNIT_DEFS.filter(u => u.cost <= 1 + tier)

  for (let i = 0; i < count; i++) {
    const def = pool[Math.floor(Math.random() * pool.length)]
    const stars: 1 | 2 = round >= 4 && Math.random() < ENEMY_STAR2_PROB ? 2 : 1
    let placed = false
    for (let attempt = 0; attempt < 20 && !placed; attempt++) {
      const r = 1 + Math.floor(Math.random() * 3)   // rows 1–3 (row 0 = building)
      const c = Math.floor(Math.random() * COLS)
      if (!b[r][c]) { b[r][c] = makeUnit(def, stars, true); placed = true }
    }
  }
  return b
}

// ─── Range helpers ────────────────────────────────────────────────────────────

/** Chebyshev distance — standard grid range metric */
function chebyshev(r1: number, c1: number, r2: number, c2: number): number {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2))
}

/** Move unit one step toward target on the board. Returns new [r,c] or null if blocked. */
function stepToward(
  board: BoardGrid,
  fromR: number, fromC: number,
  toR: number, toC: number,
): [number, number] | null {
  const dr = Math.sign(toR - fromR)
  const dc = Math.sign(toC - fromC)

  // Priority 1: direct candidates toward target
  const candidates: [number, number][] = []
  if (dr !== 0 && dc !== 0) candidates.push([fromR + dr, fromC + dc])
  if (dr !== 0) candidates.push([fromR + dr, fromC])
  if (dc !== 0) candidates.push([fromR, fromC + dc])

  for (const [nr, nc] of candidates) {
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === null
        && nr !== 0 && nr !== ROWS - 1)  // skip building rows
      return [nr, nc]
  }

  // Priority 2: fallback — try all 8 neighbours sorted by distance to target
  // This breaks deadlocks when the direct path is fully blocked
  const neighbours: [number, number, number][] = [] // [r, c, dist]
  for (let dr2 = -1; dr2 <= 1; dr2++) {
    for (let dc2 = -1; dc2 <= 1; dc2++) {
      if (dr2 === 0 && dc2 === 0) continue
      const nr = fromR + dr2, nc = fromC + dc2
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      if (board[nr][nc] !== null) continue
      if (nr === 0 || nr === ROWS - 1) continue  // skip building rows
      // Skip cells that move away in both axes (pure retreat)
      if (dr !== 0 && dc !== 0 && Math.sign(dr2) === -Math.sign(dr) && Math.sign(dc2) === -Math.sign(dc)) continue
      const dist = Math.max(Math.abs(nr - toR), Math.abs(nc - toC))
      neighbours.push([nr, nc, dist])
    }
  }
  neighbours.sort((a, b) => a[2] - b[2])
  if (neighbours.length > 0) return [neighbours[0][0], neighbours[0][1]]

  return null
}

// ─── Battle step ──────────────────────────────────────────────────────────────

export interface BattleStepResult {
  board: BoardGrid
  ongoing: boolean
  /** New projectiles spawned this tick */
  newProjectiles: import('../core/types').Projectile[]
}

/**
 * Run one tick of combat.
 *
 * Key design:
 * - We work on a mutable board copy `b` for movement.
 * - We maintain a `positions` map (uid → {r,c}) that stays in sync with `b`
 *   so distance calculations are always accurate even after movement.
 * - Units move toward nearest enemy if outside attackRange.
 * - Units attack when a target is within attackRange.
 * - deltaMs: real elapsed ms. speedMult: 1 = normal, 3 = speed-up.
 */
export function runBattleStep(board: BoardGrid, deltaMs = 16, speedMult = 1): BattleStepResult {
  const allUnits = getAllUnits(board)
  const alive = allUnits.filter(x => !x.u.dead)
  const allies = alive.filter(x => !x.u.enemy)
  const enemies = alive.filter(x => x.u.enemy)

  if (!allies.length || !enemies.length) return { board, ongoing: false, newProjectiles: [] }

  const effectiveDelta = deltaMs * speedMult
  const secondsElapsed = effectiveDelta / 1000

  const b: BoardGrid = board.map(row => [...row])
  const pos = new Map<number, { r: number; c: number }>()
  for (const { u, r, c } of alive) pos.set(u.uid, { r, c })

  // Board cell pixel size (must match renderer constants)
  const CW = 480 / COLS
  const CH = 640 / ROWS

  const newProjectiles: import('../core/types').Projectile[] = []
  let projId = Date.now()

  // Shuffle processing order each tick to prevent deterministic deadlocks
  // where the same unit always moves first and blocks others
  const aliveShuffled = [...alive].sort(() => Math.random() - 0.5)

  // ── Animation state machine ──────────────────────────────────────────────
  for (const { u } of aliveShuffled) {
    u.anim += u.animDir
    if (u.anim > 20 || u.anim < 0) u.animDir *= -1
    if ((u.animState === 'attack' || u.animState === 'hurt') && u.animDone) {
      u.animState = 'idle'; u.animFrame = 0; u.animElapsed = 0; u.animDone = false
    }
  }

  // ── Per-unit: move or attack ─────────────────────────────────────────────
  for (const { u } of aliveShuffled) {
    if (u.dead) continue

    const myPos = pos.get(u.uid)!
    const foes = u.enemy ? allies : enemies

    let closest: { u: Unit; r: number; c: number } | null = null
    let closestDist = Infinity
    for (const f of foes) {
      if (f.u.dead) continue
      const fp = pos.get(f.u.uid)!
      const d = chebyshev(myPos.r, myPos.c, fp.r, fp.c)
      if (d < closestDist) { closestDist = d; closest = { u: f.u, r: fp.r, c: fp.c } }
    }
    if (!closest) continue

    const inRange = closestDist <= u.attackRange

    if (!inRange) {
      // ── MOVE ──
      u.moveTimer += u.moveSpd * secondsElapsed
      if (u.moveTimer >= 1) {
        u.moveTimer -= 1
        const next = stepToward(b, myPos.r, myPos.c, closest.r, closest.c)
        if (next) {
          b[next[0]][next[1]] = u
          b[myPos.r][myPos.c] = null
          u.visualX = myPos.c * CW + CW / 2
          u.visualY = myPos.r * CH + CH / 2
          u.targetRow = next[0]
          u.targetCol = next[1]
          pos.set(u.uid, { r: next[0], c: next[1] })
        } else {
          // Fully blocked — refund the timer so unit retries next tick
          // instead of waiting a full move cycle
          u.moveTimer += 0.5
        }
      }
      // Face toward target horizontally while moving
      if (closest.c !== myPos.c) u.facingLeft = closest.c < myPos.c
      if (u.animState !== 'attack' && u.animState !== 'hurt') u.animState = 'run'
      continue
    }

    // ── ATTACK ──
    u.moveTimer = 0
    // Face toward target when attacking
    if (closest.c !== myPos.c) u.facingLeft = closest.c < myPos.c
    if (u.animState !== 'attack' && u.animState !== 'hurt') u.animState = 'idle'

    u.attackTimer += u.spd * secondsElapsed
    if (u.attackTimer < 1) continue
    u.attackTimer -= 1

    const inRangeFoes = foes.filter(f => {
      if (f.u.dead) return false
      const fp = pos.get(f.u.uid)!
      return chebyshev(myPos.r, myPos.c, fp.r, fp.c) <= u.attackRange
    })
    if (!inRangeFoes.length) continue

    const t = inRangeFoes[Math.floor(Math.random() * inRangeFoes.length)]
    const dmg = Math.max(1, u.atkVal + ((Math.random() * 8 | 0) - 4))
    t.u.curHp = Math.max(0, t.u.curHp - dmg)
    t.u.shake = 4

    u.animState = 'attack'; u.animFrame = 0; u.animElapsed = 0; u.animDone = false

    // Spawn arrow projectile for ranged units
    if (u.trait === 'ranged') {
      const tp = pos.get(t.u.uid)!
      newProjectiles.push({
        id: projId++,
        x: myPos.c * CW + CW / 2,
        y: myPos.r * CH + CH / 2,
        tx: tp.c * CW + CW / 2,
        ty: tp.r * CH + CH / 2,
        progress: 0,
        speed: ARROW_SPEED_PX,
        team: u.enemy ? 'red' : 'blue',
      })
    }

    t.u.floats.push({ txt: `-${dmg}`, rise: 0, life: FLOAT_TEXT_TTL, color: t.u.enemy ? '#F0997B' : '#E24B4A' })

    if (t.u.curHp <= 0) {
      t.u.dead = true; t.u.animState = 'death'; t.u.animFrame = 0; t.u.animElapsed = 0; t.u.animDone = false
    } else {
      t.u.animState = 'hurt'; t.u.animFrame = 0; t.u.animElapsed = 0; t.u.animDone = false
    }
  }

  const stillAliveAllies  = allies.filter(x => !x.u.dead)
  const stillAliveEnemies = enemies.filter(x => !x.u.dead)
  const ongoing = stillAliveAllies.length > 0 && stillAliveEnemies.length > 0

  return { board: b, ongoing, newProjectiles }
}

// ─── Battle end ───────────────────────────────────────────────────────────────

export interface BattleEndResult {
  win: boolean
  goldEarned: number
  hpLost: number
  slotsGained: number
  aliveCount: number
  enemiesAlive: number
}

export function evaluateBattleEnd(board: BoardGrid, round: number): BattleEndResult {
  const all = getAllUnits(board)
  const alliesAlive  = all.filter(x => !x.u.enemy && !x.u.dead)
  const enemiesAlive = all.filter(x =>  x.u.enemy && !x.u.dead)
  const win = enemiesAlive.length === 0
  return {
    win,
    goldEarned:   win ? WIN_GOLD_BONUS + round : 0,
    hpLost:       win ? 0 : 10 + enemiesAlive.length * 6,
    slotsGained:  win ? 1 : 0,
    aliveCount:   alliesAlive.length,
    enemiesAlive: enemiesAlive.length,
  }
}
