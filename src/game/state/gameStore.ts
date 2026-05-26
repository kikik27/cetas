'use client'

import { create } from 'zustand'
import type { GameState, SelectedSource } from '../core/types'
import { emptyBoard, getBoardUnitCount, placeOnBoard, placeOnBench } from '../systems/boardSystem'
import { generateShop, checkMerge, buyUnit as buyUnitFn } from '../systems/shopSystem'
import { generateEnemies, runBattleStep, evaluateBattleEnd, generateEnemyPreview } from '../systems/combatSystem'
import {
  BATTLE_LIMIT_MS,
  SPEED_UP_FACTOR,
  MAX_ROUNDS,
  REROLL_COST,
} from '../constants'

const MAX_LOG = 5

function addLog(logs: string[], msg: string): string[] {
  const next = [...logs, msg]
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next
}

interface GameActions {
  // Prep phase
  selectUnit: (sel: SelectedSource) => void
  clickBoardCell: (row: number, col: number) => void
  clickBenchSlot: (idx: number) => void
  buyUnit: (shopIdx: number) => void
  reroll: () => void
  sellSelected: () => void
  // Battle phase
  startBattle: () => void
  tickBattle: (deltaMs: number) => void
  endBattle: () => void
  // Round management
  nextRound: () => void
  resetGame: () => void
}

export type GameStore = GameState & GameActions

function initialState(): GameState {
  const initialMaxSlots = 3
  return {
    round: 1,
    hp: 100,
    gold: 10,
    phase: 'prep',
    maxBoardSlots: initialMaxSlots,
    board: emptyBoard(),
    bench: Array(8).fill(null),
    shop: generateShop(),
    selected: null,
    battleRunning: false,
    battleTimeMs: 0,
    speedUp: false,
    enemyPreview: generateEnemyPreview(1, initialMaxSlots),
    projectiles: [],
    log: ['Welcome! Scout the enemy above, set your formation, then attack!'],
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  selectUnit(sel) {
    set({ selected: sel })
  },

  clickBoardCell(row, col) {
    const { phase, selected, board, bench, maxBoardSlots } = get()
    if (phase !== 'prep') return

    const isEnemyZone   = row < 4
    const isBuildingRow = row === 0 || row === 7
    if (isEnemyZone || isBuildingRow) {
      set({ selected: null })
      return
    }

    if (selected) {
      const result = placeOnBoard(board, bench, selected, row, col, maxBoardSlots)
      set(s => ({
        board: result.board,
        bench: result.bench,
        selected: result.selected,
        log: result.error
          ? addLog(s.log, result.error)
          : result.log
          ? addLog(s.log, result.log)
          : s.log,
      }))
    } else {
      const unit = board[row][col]
      if (unit && !unit.enemy) {
        set({ selected: { src: 'board', r: row, c: col } })
      }
    }
  },

  clickBenchSlot(idx) {
    const { phase, selected, board, bench } = get()
    if (phase !== 'prep') return

    if (selected) {
      const result = placeOnBench(board, bench, selected, idx)
      set({ board: result.board, bench: result.bench, selected: result.selected })
    } else {
      if (bench[idx]) set({ selected: { src: 'bench', idx } })
    }
  },

  buyUnit(shopIdx) {
    const { shop, bench, gold } = get()
    const item = shop[shopIdx]
    if (!item) return

    const result = buyUnitFn(item, bench, gold)
    if (result.error) {
      set(s => ({ log: addLog(s.log, result.error!) }))
      return
    }

    const { bench: newBench, mergeLog } = checkMerge(result.bench)
    const updatedShop = shop.map((s, i) => i === shopIdx ? result.shopItem : s)

    set(s => ({
      shop: updatedShop,
      bench: newBench,
      gold: result.gold,
      log: mergeLog.reduce(
        (acc, m) => addLog(acc, m),
        addLog(s.log, result.log),
      ),
    }))
  },

  reroll() {
    const { gold } = get()
    if (gold < REROLL_COST) {
      set(s => ({ log: addLog(s.log, `Need ${REROLL_COST} gold to reroll!`) }))
      return
    }
    set(s => ({
      gold: s.gold - REROLL_COST,
      shop: generateShop(),
      log: addLog(s.log, 'Shop refreshed!'),
    }))
  },

  sellSelected() {
    const { selected, board, bench } = get()
    if (!selected) return

    const b = board.map(row => [...row])
    const bch = [...bench]
    let unit = null

    if (selected.src === 'bench') {
      unit = bch[selected.idx]
      bch[selected.idx] = null
    } else {
      unit = b[selected.r][selected.c]
      b[selected.r][selected.c] = null
    }

    if (!unit) return

    // Sell price = 50% of base cost (rounded down), stars don't inflate sell price
    const earn = Math.max(1, Math.floor(unit.cost / 2))

    set(s => ({
      board: b,
      bench: bch,
      gold: Math.min(s.gold + earn, 20),
      selected: null,
      log: addLog(s.log, `Sold ${unit!.name} +${earn}g`),
    }))
  },

  startBattle() {
    const { phase, board, maxBoardSlots, round } = get()
    if (phase !== 'prep') return
    if (getBoardUnitCount(board) === 0) {
      set(s => ({ log: addLog(s.log, 'Place at least 1 unit first!') }))
      return
    }

    const boardWithEnemies = generateEnemies(board, round, maxBoardSlots)
    set(s => ({
      phase: 'battle',
      selected: null,
      board: boardWithEnemies,
      battleRunning: true,
      battleTimeMs: 0,
      speedUp: false,
      projectiles: [],
      log: addLog(s.log, 'Battle begins!'),
    }))
  },

  tickBattle(deltaMs: number) {
    const { board, battleRunning, battleTimeMs, speedUp, projectiles } = get()
    if (!battleRunning) return

    const BATTLE_LIMIT_MS_LOCAL = BATTLE_LIMIT_MS
    const newTimeMs = battleTimeMs + deltaMs
    const wasSpeedUp = speedUp
    const nowSpeedUp = newTimeMs >= BATTLE_LIMIT_MS_LOCAL

    if (!wasSpeedUp && nowSpeedUp) {
      set(s => ({ speedUp: true, battleTimeMs: newTimeMs, log: addLog(s.log, `Time's up! Speed ${SPEED_UP_FACTOR}x!`) }))
    } else {
      set({ battleTimeMs: newTimeMs, speedUp: nowSpeedUp })
    }

    const speedMult = nowSpeedUp ? SPEED_UP_FACTOR : 1
    const { board: newBoard, ongoing, newProjectiles } = runBattleStep(board, deltaMs, speedMult)

    // Advance existing projectiles + add new ones
    const secElapsed = (deltaMs * speedMult) / 1000
    const updatedProjectiles = [
      ...projectiles.map(p => {
        const dist = Math.hypot(p.tx - p.x, p.ty - p.y)
        const step = p.speed * secElapsed
        const newProgress = dist > 0 ? Math.min(1, p.progress + step / dist) : 1
        return { ...p, progress: newProgress }
      }).filter(p => p.progress < 1),
      ...newProjectiles,
    ]

    if (!ongoing) {
      set({ board: newBoard, battleRunning: false, projectiles: [] })
      get().endBattle()
    } else {
      set({ board: newBoard, projectiles: updatedProjectiles })
    }
  },

  endBattle() {
    const { board, round, maxBoardSlots, hp, gold } = get()
    const result = evaluateBattleEnd(board, round)
    // Slot +1 always (win or lose) — capped at 12
    const newSlots = Math.min(maxBoardSlots + 1, 12)

    if (result.win) {
      const newGold = Math.min(gold + result.goldEarned, 20)
      set(s => ({
        gold: newGold,
        maxBoardSlots: newSlots,
        battleRunning: false,
        log: addLog(s.log, `Round ${round} VICTORY! +${result.goldEarned}g, slots up to ${newSlots}`),
      }))
    } else {
      const newHp = Math.max(0, hp - result.hpLost)
      set(s => ({
        hp: newHp,
        maxBoardSlots: newSlots,
        battleRunning: false,
        log: addLog(s.log, `Round ${round} DEFEAT! -${result.hpLost} HP, slots up to ${newSlots}`),
      }))
    }
  },

  nextRound() {
    const { round, hp, gold, board, maxBoardSlots } = get()
    if (hp <= 0 || round >= MAX_ROUNDS) {
      get().resetGame()
      return
    }

    // Clear enemy rows.
    // Ally units: dead ones revive to full HP (temporary death per round),
    // surviving ones heal 25% of max HP.
    const newBoard = board.map((row, r) =>
      row.map((cell) => {
        if (r < 4) return null          // clear enemy zone (rows 0–3)
        if (!cell) return null
        if (cell.enemy) return null

        const healed = cell.dead
          // Revive: full HP restore
          ? cell.maxHp
          // Survive: +25% HP
          : Math.min(cell.maxHp, cell.curHp + Math.floor(cell.maxHp * 0.25))

        return {
          ...cell,
          curHp: healed,
          dead: false,                  // revive
          anim: 0,
          animState: 'idle' as const,
          animFrame: 0,
          animElapsed: 0,
          animDone: false,
          attackTimer: 0,
          moveTimer: 0,
          floats: [],
          facingLeft: false,            // allies always reset facing right
        }
      })
    )

    // Also revive dead units on bench
    const newBench = get().bench.map(u => {
      if (!u || !u.dead) return u
      return {
        ...u,
        curHp: u.maxHp,
        dead: false,
        animState: 'idle' as const,
        animFrame: 0,
        animElapsed: 0,
        animDone: false,
        attackTimer: 0,
        moveTimer: 0,
        floats: [],
        facingLeft: false,
      }
    })

    const nextRound = round + 1
    const newGold = Math.min(gold + 5, 20)
    const newEnemyPreview = generateEnemyPreview(nextRound, maxBoardSlots)

    set(s => ({
      round: nextRound,
      phase: 'prep',
      gold: newGold,
      board: newBoard,
      bench: newBench,
      shop: generateShop(),
      selected: null,
      battleRunning: false,
      battleTimeMs: 0,
      speedUp: false,
      projectiles: [],
      enemyPreview: newEnemyPreview,
      log: addLog(s.log, `Round ${nextRound}. +5g Fallen units restored. Slots: ${maxBoardSlots}`),
    }))
  },

  resetGame() {
    set(initialState())
  },
}))
