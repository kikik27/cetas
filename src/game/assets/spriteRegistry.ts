/**
 * Asset registry — Tiny Swords (Free Pack)
 * Blue  = ally  (player units)
 * Red   = enemy units
 *
 * Available files per unit:
 *   warrior : idle, run, attack, hurt   ✓
 *   archer  : idle, run, attack         (no hurt — falls back to run)
 *   lancer  : idle, run, attack         (no hurt — falls back to run)
 *   pawn    : idle, run, attack         (no hurt — falls back to run)
 *
 * All frame sizes are 192×192px except Lancer (320×320px).
 */

export type AnimState = 'idle' | 'run' | 'attack' | 'hurt' | 'death'

export interface AnimClip {
  url: string
  frames: number
  /** ms per frame */
  fps: number
  loop: boolean
  frameW: number
  frameH: number
  effectUrl?: string
}

export interface SpriteSheet {
  clips: Record<AnimState, AnimClip>
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function clip(
  url: string,
  frames: number,
  fps: number,
  loop: boolean,
  fw = 192,
  fh = 192,
  effectUrl?: string,
): AnimClip {
  return { url, frames, fps, loop, frameW: fw, frameH: fh, effectUrl }
}

/**
 * Build a sprite sheet.
 * @param hurtUrl  explicit hurt file, or null to reuse run.png
 */
function sheet(
  base: string,
  idleFrames: number,
  runFrames: number,
  attackFrames: number,
  hurtUrl: string | null,
  hurtFrames: number,
  fw = 192,
  fh = 192,
): SpriteSheet {
  const hurtSrc = hurtUrl ?? `${base}/run.png`
  return {
    clips: {
      idle:   clip(`${base}/idle.png`,   idleFrames,   120, true,  fw, fh),
      run:    clip(`${base}/run.png`,    runFrames,    80,  true,  fw, fh),
      attack: clip(`${base}/attack.png`, attackFrames, 70,  false, fw, fh),
      // hurt: dedicated file if available, else run sheet at slower fps
      hurt:   clip(hurtSrc,             hurtFrames,   55,  false, fw, fh),
      // death: same as hurt but plays once and freezes
      death:  clip(hurtSrc,             hurtFrames,   90,  false, fw, fh),
    },
  }
}

// ─── Sprite sheets ────────────────────────────────────────────────────────────

const BLUE = '/assets/units/blue'
const RED  = '/assets/units/red'

export const SPRITE_SHEETS: Record<string, SpriteSheet> = {
  // warrior has a real hurt.png
  'blue-warrior': sheet(`${BLUE}/warrior`, 8, 6, 4, `${BLUE}/warrior/hurt.png`, 6),
  // archer: attack clip uses arrow.png as projectile effect
  'blue-archer':  sheet(`${BLUE}/archer`,  6, 4, 8, null, 4),
  'blue-lancer':  sheet(`${BLUE}/lancer`,  12, 6, 3, null, 6, 320, 320),
  'blue-pawn':    sheet(`${BLUE}/pawn`,    8, 6, 4, null, 6),

  'red-warrior':  sheet(`${RED}/warrior`,  8, 6, 4, `${RED}/warrior/hurt.png`, 6),
  'red-archer':   sheet(`${RED}/archer`,   6, 4, 8, null, 4),
  'red-lancer':   sheet(`${RED}/lancer`,   12, 6, 3, null, 6, 320, 320),
  'red-pawn':     sheet(`${RED}/pawn`,     8, 6, 4, null, 6),
}

/** Arrow projectile sprites per team */
export const ARROW_SPRITES: Record<string, string> = {
  blue: `${BLUE}/archer/arrow.png`,
  red:  `${RED}/archer/arrow.png`,
}

/**
 * Returns the sprite sheet key for a unit.
 * Uses the explicit spriteType from UnitDef — no string guessing.
 */
export function getSpriteKey(spriteType: string, isEnemy: boolean): string {
  return `${isEnemy ? 'red' : 'blue'}-${spriteType}`
}

// ─── Terrain ─────────────────────────────────────────────────────────────────

export const TERRAIN = {
  tilemap:   '/assets/terrain/tilemap.png',
  waterBg:   '/assets/terrain/water-bg.png',
  waterFoam: '/assets/terrain/water-foam.png',
  bush1:     '/assets/terrain/bush1.png',
  bush2:     '/assets/terrain/bush2.png',
  rock1:     '/assets/terrain/rock1.png',
  rock2:     '/assets/terrain/rock2.png',
}

// ─── Particle FX ─────────────────────────────────────────────────────────────

export const FX = {
  explosion: { url: '/assets/fx/explosion.png', frames: 8, fps: 60, frameW: 192, frameH: 192 },
  dust:      { url: '/assets/fx/dust.png',      frames: 8, fps: 50, frameW: 64,  frameH: 64  },
  fire:      { url: '/assets/fx/fire.png',      frames: 8, fps: 80, frameW: 64,  frameH: 64  },
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export const UI_ASSETS = {
  woodSlots: '/assets/ui/wood-slots.png',
  btnBlue:   '/assets/ui/btn-blue.png',
  btnRed:    '/assets/ui/btn-red.png',
}
