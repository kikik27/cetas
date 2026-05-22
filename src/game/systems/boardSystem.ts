// Board placement logic — pure functions
import type { BoardGrid, BenchSlots, Unit, SelectedSource } from '../core/types'

export const COLS = 8
export const ROWS = 4

/** Count player-owned units on the board (rows 2–3) */
export function getBoardUnitCount(board: BoardGrid): number {
  let n = 0
  for (let r = 2; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] && !board[r][c]!.enemy) n++
  return n
}

export function emptyBoard(): BoardGrid {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
}

export function getAllUnits(board: BoardGrid): { u: Unit; r: number; c: number }[] {
  const all: { u: Unit; r: number; c: number }[] = []
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) all.push({ u: board[r][c]!, r, c })
  return all
}

export interface PlacementResult {
  board: BoardGrid
  bench: BenchSlots
  selected: SelectedSource
  log?: string
  error?: string
}

/** Move a selected unit to a board cell */
export function placeOnBoard(
  board: BoardGrid,
  bench: BenchSlots,
  selected: SelectedSource,
  targetRow: number,
  targetCol: number,
  maxBoardSlots: number,
): PlacementResult {
  if (!selected) return { board, bench, selected: null }

  const b: BoardGrid = board.map(row => [...row])
  const bch: BenchSlots = [...bench]

  let unit: Unit | null = null
  if (selected.src === 'bench') {
    unit = bch[selected.idx]
    bch[selected.idx] = null
  } else {
    unit = b[selected.r][selected.c]
    b[selected.r][selected.c] = null
  }

  if (!unit) return { board, bench, selected: null }

  const existing = b[targetRow][targetCol]

  if (existing && !existing.enemy) {
    // Swap: put existing back to source
    if (selected.src === 'bench') bch[selected.idx] = existing
    else b[selected.r][selected.c] = existing
  } else if (!existing) {
    // Check slot limit when coming from bench
    const currentCount = getBoardUnitCount(b)
    if (selected.src === 'bench' && currentCount >= maxBoardSlots) {
      bch[selected.idx] = unit
      return {
        board: b, bench: bch, selected: null,
        error: `⚠️ Slot penuh! Maksimal ${maxBoardSlots} unit di papan.`,
      }
    }
  }

  b[targetRow][targetCol] = unit
  return {
    board: b, bench: bch, selected: null,
    log: `📍 ${unit.name} ditempatkan`,
  }
}

/** Move a selected unit to a bench slot */
export function placeOnBench(
  board: BoardGrid,
  bench: BenchSlots,
  selected: SelectedSource,
  targetIdx: number,
): PlacementResult {
  if (!selected) return { board, bench, selected: null }

  const b: BoardGrid = board.map(row => [...row])
  const bch: BenchSlots = [...bench]

  let unit: Unit | null = null
  if (selected.src === 'bench') {
    unit = bch[selected.idx]
    bch[selected.idx] = null
  } else {
    unit = b[selected.r][selected.c]
    b[selected.r][selected.c] = null
  }

  if (!unit) return { board, bench, selected: null }

  const existing = bch[targetIdx]
  bch[targetIdx] = unit
  if (existing) {
    if (selected.src === 'board') b[selected.r][selected.c] = existing
    else bch[selected.idx] = existing
  }

  return { board: b, bench: bch, selected: null }
}
