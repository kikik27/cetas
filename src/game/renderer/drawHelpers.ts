import type { Projectile, Unit } from '../core/types'
import { ARROW_SPRITES, SPRITE_SHEETS, TERRAIN, getSpriteKey, type AnimState } from '../assets/spriteRegistry'
import { loadImg } from './assetLoader'

export function drawArena(
  ctx: CanvasRenderingContext2D,
  opts: { cols: number; rows: number; cw: number; ch: number; boardW: number; tileSize: number }
) {
  const { cols, rows, cw, ch, boardW, tileSize } = opts
  const tilemap = loadImg(TERRAIN.tilemap)
  if (tilemap.complete && tilemap.naturalWidth > 0) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++)
      ctx.drawImage(tilemap, 0, tileSize, tileSize, tileSize, c * cw, r * ch, cw, ch)
    for (let r = 2; r < rows; r++) for (let c = 0; c < cols; c++)
      ctx.drawImage(tilemap, tileSize, 0, tileSize, tileSize, c * cw, r * ch, cw, ch)
  } else {
    ctx.fillStyle = '#2a1a1a'; ctx.fillRect(0, 0, boardW, ch * 2)
    ctx.fillStyle = '#1e3a1e'; ctx.fillRect(0, ch * 2, boardW, ch * 2)
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, ch * 2, boardW, 2)
}

export function drawHpBar(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number, spriteW: number, spriteH: number) {
  const barW = spriteW - 4, barH = 5
  const bx = cx - barW / 2, by = cy + spriteH / 2 - barH - 1
  const pct = Math.max(0, unit.curHp / unit.maxHp)
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx, by, barW, barH)
  ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#f87171'
  ctx.fillRect(bx, by, Math.round(barW * pct), barH)
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.5; ctx.strokeRect(bx, by, barW, barH)
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: number, cx: number, cy: number, spriteH: number) {
  if (stars <= 1) return
  ctx.save(); ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fbbf24'
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2
  const txt = '★'.repeat(stars), tw = ctx.measureText(txt).width
  ctx.strokeText(txt, cx - tw / 2, cy - spriteH / 2 + 10)
  ctx.fillText(txt, cx - tw / 2, cy - spriteH / 2 + 10)
  ctx.restore()
}

export function drawFloats(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number, spriteH: number) {
  unit.floats = unit.floats.filter(f => {
    ctx.save(); ctx.globalAlpha = Math.max(0, f.life / 20)
    ctx.font = 'bold 13px sans-serif'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.fillStyle = f.color
    ctx.strokeText(f.txt, cx - 10, cy - spriteH / 2 - f.rise)
    ctx.fillText(f.txt, cx - 10, cy - spriteH / 2 - f.rise)
    ctx.restore(); f.rise += 1.5; f.life--; return f.life > 0
  })
}

export function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, frame: number, cx: number, cy: number, spriteW: number, spriteH: number) {
  const key = getSpriteKey(unit.spriteType, unit.enemy)
  const sheet = SPRITE_SHEETS[key]
  if (!sheet) return
  const animState: AnimState = unit.dead ? 'death' : (unit.animState as AnimState) ?? 'idle'
  const clip = sheet.clips[animState] ?? sheet.clips.idle
  const img = loadImg(clip.url)
  const destX = cx - spriteW / 2, destY = cy - spriteH / 2
  if (unit.dead) {
    const progress = clip.frames > 1 ? frame / (clip.frames - 1) : 1
    ctx.globalAlpha = Math.max(0.1, 1 - progress * 0.9)
  }
  if (img.complete && img.naturalWidth > 0) {
    const flipX = unit.facingLeft
    ctx.save()
    if (flipX) {
      ctx.translate(cx + spriteW / 2, destY); ctx.scale(-1, 1)
      ctx.drawImage(img, frame * clip.frameW, 0, clip.frameW, clip.frameH, 0, 0, spriteW, spriteH)
    } else {
      ctx.drawImage(img, frame * clip.frameW, 0, clip.frameW, clip.frameH, destX, destY, spriteW, spriteH)
    }
    ctx.restore()
  } else {
    ctx.fillStyle = unit.enemy ? '#7f1d1d' : '#1e3a5f'
    ctx.fillRect(destX + 4, destY + 4, spriteW - 8, spriteH - 8)
  }
  ctx.globalAlpha = 1
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const p of projectiles) {
    const arrowImg = loadImg(ARROW_SPRITES[p.team] ?? ARROW_SPRITES.blue)
    const curX = p.x + (p.tx - p.x) * p.progress
    const curY = p.y + (p.ty - p.y) * p.progress
    const angle = Math.atan2(p.ty - p.y, p.tx - p.x)
    const size = 20
    ctx.save(); ctx.translate(curX, curY); ctx.rotate(angle)
    if (arrowImg.complete && arrowImg.naturalWidth > 0) {
      ctx.drawImage(arrowImg, -size / 2, -size / 2, size, size)
    } else {
      ctx.strokeStyle = p.team === 'blue' ? '#60a5fa' : '#f87171'
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke()
    }
    ctx.restore()
  }
}
