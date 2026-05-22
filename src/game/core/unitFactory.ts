// Pure factory — no side effects, no imports from rendering or state layers
import { UNIT_DEFS, type UnitDef } from '../entities/unitDefs'
import type { Unit } from './types'

let UID = 0

export function resetUIDCounter() {
  UID = 0
}

export function makeUnit(def: UnitDef, stars: 1 | 2 | 3 = 1, enemy = false): Unit {
  const multiplier = stars === 3 ? 3.2 : stars === 2 ? 1.8 : 1
  return {
    uid: ++UID,
    id: def.id,
    name: def.name,
    cost: def.cost,
    stars,
    enemy,
    trait: def.trait,
    spriteType: def.spriteType,
    avatarIndex: def.avatarIndex,
    traitLabel: def.traitLabel,
    maxHp: Math.round(def.hp * multiplier),
    curHp: Math.round(def.hp * multiplier),
    atkVal: Math.round(def.atk * multiplier),
    spd: def.spd,
    attackRange: def.attackRange,
    moveSpd: def.moveSpd,
    moveTimer: 0,
    visualX: 0,
    visualY: 0,
    targetRow: 0,
    targetCol: 0,
    color: def.color,
    accent: def.accent,
    body: def.body,
    animState: 'idle',
    animFrame: 0,
    animElapsed: 0,
    animDone: false,
    anim: 0,
    animDir: 1,
    shake: 0,
    attackTimer: 0,
    dead: false,
    floats: [],
  }
}

export function getDefById(id: string): UnitDef {
  const def = UNIT_DEFS.find(d => d.id === id)
  if (!def) throw new Error(`Unknown unit id: ${id}`)
  return def
}
