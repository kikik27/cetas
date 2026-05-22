'use client'

import { useEffect, useRef } from 'react'
import type { BoardGrid, Unit, SelectedSource, Projectile } from '../core/types'
import { COLS, ROWS } from '../systems/boardSystem'
import { SPRITE_SHEETS, TERRAIN, FX, ARROW_SPRITES, getSpriteKey, type AnimState } from '../assets/spriteRegistry'

export const BOARD_W = 672
export const BOARD_H = 384
export const CW = BOARD_W / COLS   // 84
export const CH = BOARD_H / ROWS   // 96
const SPRITE_W = 80
const SPRITE_H = 88

// ─── Image cache ──────────────────────────────────────────────────────────────

const imgCache = new Map<string, HTMLImageElement>()
function loadImg(url: string): HTMLImageElement {
  if (imgCache.has(url)) return imgCache.get(url)!
  const img = new Image()
  img.src = url
  imgCache.set(url, img)
  return img
}
function preloadAll() {
  for (const sheet of Object.values(SPRITE_SHEETS))
    for (const c of Object.values(sheet.clips)) { loadImg(c.url); if (c.effectUrl) loadImg(c.effectUrl) }
  Object.values(TERRAIN).forEach(loadImg)
  Object.values(FX).forEach(f => loadImg(f.url))
  Object.values(ARROW_SPRITES).forEach(loadImg)
}

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

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawArena(ctx: CanvasRenderingContext2D) {
  const tilemap = loadImg(TERRAIN.tilemap)
  const TILE = 64
  if (tilemap.complete && tilemap.naturalWidth > 0) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < COLS; c++)
      ctx.drawImage(tilemap, 0, TILE, TILE, TILE, c * CW, r * CH, CW, CH)
    for (let r = 2; r < ROWS; r++) for (let c = 0; c < COLS; c++)
      ctx.drawImage(tilemap, TILE, 0, TILE, TILE, c * CW, r * CH, CW, CH)
  } else {
    ctx.fillStyle = '#2a1a1a'; ctx.fillRect(0, 0, BOARD_W, CH * 2)
    ctx.fillStyle = '#1e3a1e'; ctx.fillRect(0, CH * 2, BOARD_W, CH * 2)
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, CH * 2, BOARD_W, 2)
  const rock = loadImg(TERRAIN.rock1)
  if (rock.complete && rock.naturalWidth > 0)
    [1, 3, 5, 7].forEach(c => ctx.drawImage(rock, 0, 0, 64, 64, c * CW + CW / 2 - 16, CH * 2 - 14, 32, 32))
  ctx.save()
  ctx.font = 'bold 10px sans-serif'
  ctx.fillStyle = 'rgba(255,100,100,0.7)'; ctx.fillText('MUSUH', 6, 14)
  ctx.fillStyle = 'rgba(100,180,255,0.7)'; ctx.fillText('PASUKANMU', 6, CH * 3 - 4)
  ctx.restore()
}

function drawHpBar(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number) {
  const barW = SPRITE_W - 4, barH = 5
  const bx = cx - barW / 2, by = cy + SPRITE_H / 2 - barH - 1
  const pct = Math.max(0, unit.curHp / unit.maxHp)
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx, by, barW, barH)
  ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#f87171'
  ctx.fillRect(bx, by, Math.round(barW * pct), barH)
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.5; ctx.strokeRect(bx, by, barW, barH)
}

function drawStars(ctx: CanvasRenderingContext2D, stars: number, cx: number, cy: number) {
  if (stars <= 1) return
  ctx.save(); ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fbbf24'
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2
  const txt = '★'.repeat(stars), tw = ctx.measureText(txt).width
  ctx.strokeText(txt, cx - tw / 2, cy - SPRITE_H / 2 + 10)
  ctx.fillText(txt, cx - tw / 2, cy - SPRITE_H / 2 + 10)
  ctx.restore()
}

function drawFloats(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number) {
  unit.floats = unit.floats.filter(f => {
    ctx.save(); ctx.globalAlpha = Math.max(0, f.life / 20)
    ctx.font = 'bold 13px sans-serif'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.fillStyle = f.color
    ctx.strokeText(f.txt, cx - 10, cy - SPRITE_H / 2 - f.rise)
    ctx.fillText(f.txt, cx - 10, cy - SPRITE_H / 2 - f.rise)
    ctx.restore(); f.rise += 1.5; f.life--; return f.life > 0
  })
}

function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, frame: number, cx: number, cy: number) {
  const key = getSpriteKey(unit.spriteType, unit.enemy)
  const sheet = SPRITE_SHEETS[key]
  if (!sheet) return
  const animState: AnimState = unit.dead ? 'death' : (unit.animState as AnimState) ?? 'idle'
  const clip = sheet.clips[animState] ?? sheet.clips.idle
  const img = loadImg(clip.url)
  const destX = cx - SPRITE_W / 2, destY = cy - SPRITE_H / 2
  if (unit.dead) {
    const progress = clip.frames > 1 ? frame / (clip.frames - 1) : 1
    ctx.globalAlpha = Math.max(0.1, 1 - progress * 0.9)
  }
  if (img.complete && img.naturalWidth > 0) {
    const flipX = unit.enemy
    ctx.save()
    if (flipX) {
      ctx.translate(cx + SPRITE_W / 2, destY); ctx.scale(-1, 1)
      ctx.drawImage(img, frame * clip.frameW, 0, clip.frameW, clip.frameH, 0, 0, SPRITE_W, SPRITE_H)
    } else {
      ctx.drawImage(img, frame * clip.frameW, 0, clip.frameW, clip.frameH, destX, destY, SPRITE_W, SPRITE_H)
    }
    ctx.restore()
  } else {
    ctx.fillStyle = unit.enemy ? '#7f1d1d' : '#1e3a5f'
    ctx.fillRect(destX + 4, destY + 4, SPRITE_W - 8, SPRITE_H - 8)
  }
  ctx.globalAlpha = 1
}

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const p of projectiles) {
    const arrowImg = loadImg(ARROW_SPRITES[p.team] ?? ARROW_SPRITES.blue)
    const curX = p.x + (p.tx - p.x) * p.progress
    const curY = p.y + (p.ty - p.y) * p.progress
    const angle = Math.atan2(p.ty - p.y, p.tx - p.x)
    const size = 20
    ctx.save()
    ctx.translate(curX, curY)
    ctx.rotate(angle)
    if (arrowImg.complete && arrowImg.naturalWidth > 0) {
      ctx.drawImage(arrowImg, -size / 2, -size / 2, size, size)
    } else {
      // Fallback: simple line arrow
      ctx.strokeStyle = p.team === 'blue' ? '#60a5fa' : '#f87171'
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke()
    }
    ctx.restore()
  }
}

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

  useEffect(() => { preloadAll() }, [])

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
      // 84px per cell, ~0.8s per cell = ~105 px/s. Feels like actual walking.
      const MOVE_PX_PER_SEC = 105
      const maxStep = MOVE_PX_PER_SEC * (deltaMs / 1000)

      let boardUnitCount = 0
      for (let r = 2; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (curBoard[r][c] && !curBoard[r][c]!.enemy) boardUnitCount++

      ctx.clearRect(0, 0, BOARD_W, BOARD_H)
      drawArena(ctx)

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
          const isEnemyZone = r < 2
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

          drawUnit(ctx, u, frame, vp.x, vp.y)
          if (!u.dead) { drawHpBar(ctx, u, vp.x, vp.y); drawStars(ctx, u.stars, vp.x, vp.y) }
          drawFloats(ctx, u, vp.x, vp.y)
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
