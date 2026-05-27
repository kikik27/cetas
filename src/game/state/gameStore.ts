'use client'

import { create } from 'zustand'
import type { GameState, SelectedSource } from '../core/types'
import { emptyBoard, getBoardUnitCount, placeOnBoard, placeOnBench } from '../systems/boardSystem'
import { generateShop, checkFormationMerge, buyUnit as buyUnitFn } from '../systems/shopSystem'
import { generateEnemies, runBattleStep, evaluateBattleEnd, generateEnemyPreview } from '../systems/combatSystem'
import { getDefById, makeUnit } from '../core/unitFactory'
import {
  BATTLE_LIMIT_MS,
  INITIAL_STAGE,
  MAX_GOLD,
  MAX_BOARD_SLOTS,
  INITIAL_BOARD_SLOTS,
  SPEED_UP_FACTOR,
  STARTING_GOLD,
  REROLL_COST,
  REROLLS_PER_STAGE,
} from '../constants'
import type { BoardGrid, BenchSlots, Unit } from '../core/types'
import type { PlayerGameProgressDTO, SavedGameUnitDTO } from '@/src/lib/api-types'
import { playerKeys } from '@/src/hooks/usePlayer'
import { queryClient } from '@/src/lib/queryClient'

const MAX_LOG = 5

function addLog(logs: string[], msg: string): string[] {
  const next = [...logs, msg]
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next
}

function addLogs(logs: string[], messages: string[]): string[] {
  return messages.reduce((acc, msg) => addLog(acc, msg), logs)
}

interface GameActions {
  setSavedStage: (stage: number) => void
  setSavedProgress: (progress: PlayerGameProgressDTO | null) => void
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
  return {
    round: INITIAL_STAGE,
    hp: 100,
    gold: STARTING_GOLD,
    phase: 'prep',
    maxBoardSlots: INITIAL_BOARD_SLOTS,
    rerollsLeft: REROLLS_PER_STAGE,
    board: emptyBoard(),
    bench: Array(8).fill(null),
    shop: generateShop(),
    selected: null,
    battleRunning: false,
    battleTimeMs: 0,
    speedUp: false,
    enemyPreview: generateEnemyPreview(INITIAL_STAGE, INITIAL_BOARD_SLOTS),
    formationBoard: null,
    lastBattleResult: null,
    projectiles: [],
    log: ['Endless mode. Scout the stage, set your formation, then attack!'],
  }
}

function cloneUnit(unit: Unit): Unit {
  return {
    ...unit,
    body: unit.body.map(row => [...row]),
    floats: unit.floats.map(f => ({ ...f })),
  }
}

function recallUnit(unit: Unit): Unit {
  return {
    ...cloneUnit(unit),
    curHp: unit.maxHp,
    dead: false,
    anim: 0,
    animState: 'idle',
    animFrame: 0,
    animElapsed: 0,
    animDone: false,
    attackTimer: 0,
    moveTimer: 0,
    floats: [],
    shake: 0,
    facingLeft: unit.enemy,
  }
}

function snapshotFormation(board: BoardGrid): BoardGrid {
  return board.map((row, r) =>
    row.map(unit => {
      if (!unit || unit.enemy || r < 4) return null
      return recallUnit(unit)
    })
  )
}

function recallBench(bench: BenchSlots): BenchSlots {
  return bench.map(unit => unit ? recallUnit(unit) : null)
}

function serializeUnit(unit: Unit | null): SavedGameUnitDTO | null {
  if (!unit || unit.enemy) return null
  return {
    id: unit.id,
    stars: unit.stars as 1 | 2 | 3,
  }
}

function serializeBoard(board: BoardGrid): PlayerGameProgressDTO['board'] {
  return board.map((row, r) =>
    row.map(unit => r < 4 ? null : serializeUnit(unit))
  )
}

function serializeBench(bench: BenchSlots): PlayerGameProgressDTO['bench'] {
  return bench.map(serializeUnit)
}

function deserializeUnit(saved: SavedGameUnitDTO | null): Unit | null {
  if (!saved) return null
  try {
    return recallUnit(makeUnit(getDefById(saved.id), saved.stars, false))
  } catch {
    return null
  }
}

function deserializeBoard(saved: PlayerGameProgressDTO['board']): BoardGrid {
  const board = emptyBoard()
  saved.forEach((row, r) => {
    if (r < 4 || r >= board.length) return
    row.forEach((unit, c) => {
      if (c < board[r].length) board[r][c] = deserializeUnit(unit)
    })
  })
  return board
}

function deserializeBench(saved: PlayerGameProgressDTO['bench']): BenchSlots {
  return Array.from({ length: 8 }, (_, i) => deserializeUnit(saved[i] ?? null))
}

function persistGameProgress(state: {
  round: number
  hp: number
  gold: number
  maxBoardSlots: number
  rerollsLeft: number
  board: BoardGrid
  bench: BenchSlots
}, stageOverride?: number): void {
  fetch('/api/player/endless', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({
      stage: stageOverride ?? state.round,
      hp: state.hp,
      gold: state.gold,
      maxBoardSlots: state.maxBoardSlots,
      rerollsLeft: state.rerollsLeft,
      board: serializeBoard(state.board),
      bench: serializeBench(state.bench),
    }),
  })
    .then(async res => {
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) return
      queryClient.setQueryData(playerKeys.me, (current: unknown) =>
        current && typeof current === 'object'
          ? { ...current, ...json.data }
          : current
      )
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    })
    .catch(() => {})
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  setSavedStage(stage) {
    if (!Number.isFinite(stage) || stage < 1) return
    const { phase, battleRunning, board, bench } = get()
    if (phase !== 'prep' || battleRunning) return
    if (getBoardUnitCount(board) > 0 || bench.some(Boolean)) return

    const safeStage = Math.floor(stage)
    set(s => ({
      round: safeStage,
      enemyPreview: generateEnemyPreview(safeStage, s.maxBoardSlots),
      log: [`Endless mode. Continue from Stage ${safeStage}.`],
    }))
  },

  setSavedProgress(progress) {
    if (!progress || !Number.isFinite(progress.stage) || progress.stage < 1) return
    const { phase, battleRunning, board, bench } = get()
    if (phase !== 'prep' || battleRunning) return
    if (getBoardUnitCount(board) > 0 || bench.some(Boolean)) return

    const safeStage = Math.floor(progress.stage)
    const maxBoardSlots = Math.max(1, Math.min(MAX_BOARD_SLOTS, Math.floor(progress.maxBoardSlots)))
    set({
      round: safeStage,
      hp: Math.max(0, Math.min(100, Math.floor(progress.hp))),
      gold: Math.max(0, Math.min(MAX_GOLD, Math.floor(progress.gold))),
      maxBoardSlots,
      rerollsLeft: Math.max(0, Math.min(REROLLS_PER_STAGE, Math.floor(progress.rerollsLeft ?? REROLLS_PER_STAGE))),
      board: deserializeBoard(progress.board),
      bench: deserializeBench(progress.bench),
      enemyPreview: generateEnemyPreview(safeStage, maxBoardSlots),
      log: [`Endless mode. Continue from Stage ${safeStage}.`],
    })
  },

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
      const merged = result.error
        ? { board: result.board, bench: result.bench, mergeLog: [] }
        : checkFormationMerge(result.board, result.bench)
      set(s => ({
        board: merged.board,
        bench: merged.bench,
        selected: result.selected,
        log: addLogs(
          result.error
            ? addLog(s.log, result.error)
            : result.log
            ? addLog(s.log, result.log)
            : s.log,
          merged.mergeLog,
        ),
      }))
      persistGameProgress(get())
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
      const merged = checkFormationMerge(result.board, result.bench)
      set(s => ({
        board: merged.board,
        bench: merged.bench,
        selected: result.selected,
        log: addLogs(s.log, merged.mergeLog),
      }))
      persistGameProgress(get())
    } else {
      if (bench[idx]) set({ selected: { src: 'bench', idx } })
    }
  },

  buyUnit(shopIdx) {
    const { shop, board, bench, gold } = get()
    const item = shop[shopIdx]
    if (!item) return

    const result = buyUnitFn(item, bench, gold)
    if (result.error) {
      set(s => ({ log: addLog(s.log, result.error!) }))
      return
    }

    const { board: newBoard, bench: newBench, mergeLog } = checkFormationMerge(board, result.bench)
    const updatedShop = shop.map((s, i) => i === shopIdx ? result.shopItem : s)

    set(s => ({
      shop: updatedShop,
      board: newBoard,
      bench: newBench,
      gold: result.gold,
      selected: mergeLog.length ? null : s.selected,
      log: addLogs(addLog(s.log, result.log), mergeLog),
    }))
    persistGameProgress(get())
  },

  reroll() {
    const { gold, rerollsLeft } = get()
    if (rerollsLeft <= 0) {
      set(s => ({ log: addLog(s.log, 'No shop refreshes left this stage.') }))
      return
    }
    if (gold < REROLL_COST) {
      set(s => ({ log: addLog(s.log, `Need ${REROLL_COST} gold to reroll!`) }))
      return
    }
    set(s => ({
      gold: s.gold - REROLL_COST,
      rerollsLeft: Math.max(0, s.rerollsLeft - 1),
      shop: generateShop(),
      log: addLog(s.log, `Shop refreshed! ${Math.max(0, s.rerollsLeft - 1)} left.`),
    }))
    persistGameProgress(get())
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
      gold: Math.min(s.gold + earn, MAX_GOLD),
      selected: null,
      log: addLog(s.log, `Sold ${unit!.name} +${earn}g`),
    }))
    persistGameProgress(get())
  },

  startBattle() {
    const { phase, board, maxBoardSlots, round } = get()
    if (phase !== 'prep') return
    if (getBoardUnitCount(board) === 0) {
      set(s => ({ log: addLog(s.log, 'Place at least 1 unit first!') }))
      return
    }

    const formationBoard = snapshotFormation(board)
    const boardWithEnemies = generateEnemies(board, round, maxBoardSlots)
    set(s => ({
      phase: 'battle',
      selected: null,
      board: boardWithEnemies,
      formationBoard,
      lastBattleResult: null,
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
    const { board, bench, round, maxBoardSlots, hp, gold, formationBoard } = get()
    const result = evaluateBattleEnd(board, round)
    const newSlots = result.win ? Math.min(maxBoardSlots + result.slotsGained, MAX_BOARD_SLOTS) : maxBoardSlots
    const resolvedResult = { ...result, slotsGained: newSlots > maxBoardSlots ? 1 : 0 }
    const recalledBoard = snapshotFormation(formationBoard ?? board)
    const recalledBench = recallBench(bench)
    const newGold = Math.min(gold + result.goldEarned, MAX_GOLD)

    if (result.win) {
      const nextStage = round + 1
      set(s => ({
        gold: newGold,
        maxBoardSlots: newSlots,
        board: recalledBoard,
        bench: recalledBench,
        formationBoard: null,
        lastBattleResult: resolvedResult,
        battleRunning: false,
        log: addLog(s.log, `Stage ${round} VICTORY! +${result.goldEarned}g, slots up to ${newSlots}`),
      }))
      persistGameProgress(get(), nextStage)
    } else {
      const newHp = Math.max(0, hp - result.hpLost)
      set(s => ({
        hp: newHp,
        gold: newGold,
        maxBoardSlots: newSlots,
        board: recalledBoard,
        bench: recalledBench,
        formationBoard: null,
        lastBattleResult: resolvedResult,
        battleRunning: false,
        log: addLog(s.log, `Stage ${round} DEFEAT! -${result.hpLost} HP, +${result.goldEarned}g, retry stage ${round}`),
      }))
      persistGameProgress(get())
    }
  },

  nextRound() {
    const { round, hp, maxBoardSlots, lastBattleResult } = get()
    if (hp <= 0) {
      get().resetGame()
      return
    }

    const nextRound = lastBattleResult?.win ? round + 1 : round
    const newEnemyPreview = generateEnemyPreview(nextRound, maxBoardSlots)

    set(s => ({
      round: nextRound,
      phase: 'prep',
      shop: generateShop(),
      rerollsLeft: REROLLS_PER_STAGE,
      selected: null,
      battleRunning: false,
      battleTimeMs: 0,
      speedUp: false,
      projectiles: [],
      enemyPreview: newEnemyPreview,
      lastBattleResult: null,
      log: addLog(s.log, lastBattleResult?.win
        ? `Stage ${nextRound}. Scout, shop, and push forward. Slots: ${maxBoardSlots}`
        : `Retry Stage ${nextRound}. Shop refreshed. Slots: ${maxBoardSlots}`),
    }))
    persistGameProgress(get())
  },

  resetGame() {
    set(initialState())
    persistGameProgress(get())
  },
}))
