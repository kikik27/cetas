'use client'

import { useEffect, useRef } from 'react'
import type { BoardGrid, Unit, SelectedSource, Projectile } from '../core/types'
import { COLS, ROWS } from '../systems/boardSystem'
import { SPRITE_SHEETS, getSpriteKey, type AnimState } from '../assets/spriteRegistry'
import { loadImg, preloadAllGameImages } from './assetLoader'
import { drawArena, drawFloats, drawHpBar, drawProjectiles, drawStars, drawUnit } from './drawHelpers'

export const BOARD_W = 800
export const BOARD_H = 540
export const CW = BOARD_W / COLS   // 100
export const CH = BOARD_H / ROWS   // 90
const SPRITE_W = 88
const SPRITE_H = 96
const TILE_SIZE = 64

// ─── Image loading moved to assetLoader.ts ───────────────────────────────────

// ─── Per-unit animation clock ─────────────────────────────────────────────────

interface Clock { frame: number; elapsed: number; lastState: string }
const clocks = new Map<number, Clock>()

function getClock(uid: number, state: string): Clock {
  if (!clocks.has(uid)) clocks.set(uid, { frame: 0, elapsed: 0, lastState: state })
  return clocks.get(uid)!
}

function tickClock(clock: Clock, unit: Unit, deltaMs: number): number {
  const animState: AnimState = unit.dead ? 'death' : (unit.animState as AnimState) ?? 'idle'
  const key = getSpriteKey(unit.spriteType, unit.enemy)
  const sheet = SPRITE_SHEETS[key]
  if (!sheet) return 0
  const clip = sheet.clips[animState] ?? sheet.clips.idle
  if (clock.lastState !== animState) { clock.frame = 0; clock.elapsed = 0; clock.lastState = animState }
  clock.elapsed += deltaMs
  while (clock.elapsed >= clip.fps) {
    clock.elapsed -= clip.fps; clock.frame++
    if (clock.frame >= clip.frames) {
      if (clip.loop) clock.frame = 0
      else { clock.frame = clip.frames - 1; unit.animDone = true; break }
    }
  }
  return clock.frame
}

// ─── Per-unit visual position (smooth interpolation) ─────────────────────────
// Stored outside React — updated every RAF frame

interface VisualPos { x: number; y: number }
const visualPos = new Map<number, VisualPos>()

function getVisualPos(uid: number, targetX: number, targetY: number): VisualPos {
  if (!visualPos.has(uid)) visualPos.set(uid, { x: targetX, y: targetY })
  return visualPos.get(uid)!
}

// ─── Drawing helpers moved to drawHelpers.ts ───────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

interface PixiBoardProps {
  board: BoardGrid
  phase: 'prep' | 'battle'
  selected: SelectedSource
  maxBoardSlots: number
  speedUp?: boolean
  projectiles?: Projectile[]
  onCellClick: (row: number, col: number) => void
}

export default function PixiBoard({
  board, phase, selected, maxBoardSlots, speedUp = false, projectiles = [], onCellClick,
}: PixiBoardProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Refs so RAF loop always reads latest without restarting
  const boardRef       = useRef(board)
  const phaseRef       = useRef(phase)
  const selectedRef    = useRef(selected)
  const maxSlotsRef    = useRef(maxBoardSlots)
  const speedUpRef     = useRef(speedUp)
  const projectilesRef = useRef(projectiles)

  boardRef.current       = board
  phaseRef.current       = phase
  selectedRef.current    = selected
  maxSlotsRef.current    = maxBoardSlots
  speedUpRef.current     = speedUp
  projectilesRef.current = projectiles

  useEffect(() => { preloadAllGameImages() }, [])

  // Single persistent RAF loop
  useEffect(() => {
    let running = true

    function loop(ts: number) {
      if (!running) return
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return }

      const deltaMs = lastTimeRef.current ? Math.min(ts - lastTimeRef.current, 50) : 16
      lastTimeRef.current = ts

      const curBoard    = boardRef.current
      const curPhase    = phaseRef.current
      const curSelected = selectedRef.current
      const curMaxSlots = maxSlotsRef.current
      const curSpeedUp  = speedUpRef.current
      const curProjs    = projectilesRef.current
      const animDelta   = curSpeedUp ? deltaMs * 3 : deltaMs

      // Smooth movement: move visual position toward logical at fixed px/s speed
      // 100px per cell, ~0.8s per cell = ~125 px/s
      const MOVE_PX_PER_SEC = 125
      const maxStep = MOVE_PX_PER_SEC * (deltaMs / 1000)

      let boardUnitCount = 0
      for (let r = 3; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (curBoard[r][c] && !curBoard[r][c]!.enemy) boardUnitCount++

      ctx.clearRect(0, 0, BOARD_W, BOARD_H)
      drawArena(ctx, { cols: COLS, rows: ROWS, cw: CW, ch: CH, boardW: BOARD_W, tileSize: TILE_SIZE })

      if (curSpeedUp) {
        ctx.save()
        const grad = ctx.createRadialGradient(BOARD_W/2, BOARD_H/2, BOARD_H*0.2, BOARD_W/2, BOARD_H/2, BOARD_H*0.8)
        grad.addColorStop(0, 'rgba(255,120,0,0)'); grad.addColorStop(1, 'rgba(255,80,0,0.18)')
        ctx.fillStyle = grad; ctx.fillRect(0, 0, BOARD_W, BOARD_H); ctx.restore()
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) ctx.strokeRect(c * CW, r * CH, CW, CH)

      // Draw cell highlights
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const isEnemyZone = r < 3
          const isSelected = curSelected?.src === 'board' &&
            (curSelected as { src: 'board'; r: number; c: number }).r === r &&
            (curSelected as { src: 'board'; r: number; c: number }).c === c
          const isDropTarget = curPhase === 'prep' && !isEnemyZone && !isSelected &&
            curSelected !== null && boardUnitCount < curMaxSlots && !curBoard[r][c]
          if (isSelected) {
            ctx.fillStyle = 'rgba(100,200,255,0.30)'; ctx.fillRect(c*CW, r*CH, CW, CH)
            ctx.strokeStyle = 'rgba(100,200,255,0.8)'; ctx.lineWidth = 2; ctx.strokeRect(c*CW+1, r*CH+1, CW-2, CH-2)
          } else if (isDropTarget) {
            ctx.fillStyle = 'rgba(100,255,160,0.15)'; ctx.fillRect(c*CW, r*CH, CW, CH)
            ctx.strokeStyle = 'rgba(100,255,160,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(c*CW+1, r*CH+1, CW-2, CH-2)
          }
        }
      }

      // Draw units with smooth interpolated positions
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const u = curBoard[r][c]
          if (!u) continue

          // Logical target position (cell center)
          const targetX = c * CW + CW / 2
          const targetY = r * CH + CH / 2

          // Get or init visual position
          const vp = getVisualPos(u.uid, targetX, targetY)

          // Move visual position toward logical at fixed pixel speed
          const dx = targetX - vp.x
          const dy = targetY - vp.y
          const dist = Math.hypot(dx, dy)
          if (dist > 0.5) {
            const step = Math.min(dist, maxStep)
            vp.x += (dx / dist) * step
            vp.y += (dy / dist) * step
          } else {
            vp.x = targetX
            vp.y = targetY
          }

          const clock = getClock(u.uid, u.animState ?? 'idle')
          const frame = tickClock(clock, u, animDelta)

          drawUnit(ctx, u, frame, vp.x, vp.y, SPRITE_W, SPRITE_H)
          if (!u.dead) { drawHpBar(ctx, u, vp.x, vp.y, SPRITE_W, SPRITE_H); drawStars(ctx, u.stars, vp.x, vp.y, SPRITE_H) }
          drawFloats(ctx, u, vp.x, vp.y, SPRITE_H)
        }
      }

      // Draw projectiles (arrows)
      drawProjectiles(ctx, curProjs)

      if (curSpeedUp) {
        ctx.save(); ctx.font = 'bold 11px sans-serif'
        ctx.fillStyle = 'rgba(255,160,40,0.9)'; ctx.fillText('⚡ 3× SPEED', BOARD_W - 80, 14); ctx.restore()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = BOARD_W / rect.width, scaleY = BOARD_H / rect.height
    const mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY
    const col = Math.floor(mx / CW), row = Math.floor(my / CH)
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return
    onCellClick(row, col)
  }

  return (
    <canvas
      ref={canvasRef} width={BOARD_W} height={BOARD_H}
      onClick={handleClick}
      className="block w-full rounded-lg cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
      aria-label="Game board"
    />
  )
}

// ─── Mini preview ─────────────────────────────────────────────────────────────

export function drawUnitPreview(
  canvas: HTMLCanvasElement,
  unit: { spriteType?: string; body: number[][]; color: string; accent: string; stars: number },
  size = 48,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const key = unit.spriteType ? getSpriteKey(unit.spriteType, false) : null
  if (key && SPRITE_SHEETS[key]) {
    const sheet = SPRITE_SHEETS[key]
    const clip = sheet.clips.idle
    const img = loadImg(clip.url)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, clip.frameW, clip.frameH, 2, 2, size, size)
      if (unit.stars > 1) { ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('★'.repeat(unit.stars), 2, 11) }
    }
    if (img.complete && img.naturalWidth > 0) draw()
    else img.onload = draw
    return
  }
  const pw = Math.floor(size / 4)
  unit.body.forEach((row, ri) => {
    row.forEach((px, ci) => {
      if (!px) return
      ctx.fillStyle = ri === 0 && (ci === 1 || ci === 2) ? unit.accent : unit.color
      ctx.fillRect(2 + ci * pw, 2 + ri * pw, pw, pw)
    })
  })
}


