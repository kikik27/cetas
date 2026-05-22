// Pure data — no rendering, no game state
export type UnitTrait = 'melee' | 'ranged' | 'tank'

/** Maps to an available Tiny Swords sprite sheet type */
export type SpriteType = 'warrior' | 'archer' | 'lancer' | 'pawn'

export interface UnitDef {
  id: string
  name: string
  cost: number
  atk: number
  hp: number
  spd: number
  color: string
  accent: string
  trait: UnitTrait
  spriteType: SpriteType
  avatarIndex: string
  traitLabel: string
  /** Attack range in grid cells (Chebyshev distance) */
  attackRange: number
  /** Movement speed: cells moved per second */
  moveSpd: number
  body: number[][]
}

export const UNIT_DEFS: UnitDef[] = [
  {
    id: 'warrior', name: 'Prajurit', cost: 1, atk: 28, hp: 120, spd: 1.0,
    color: '#378ADD', accent: '#B5D4F4', trait: 'melee', spriteType: 'warrior',
    avatarIndex: '03', traitLabel: 'Melee',
    attackRange: 1, moveSpd: 0.6,   // 1 cell per ~1.7s — visible walk
    body: [[0,1,1,0],[1,1,1,1],[0,1,1,0],[0,1,0,0],[1,0,0,1]],
  },
  {
    id: 'archer', name: 'Pemanah', cost: 1, atk: 22, hp: 75, spd: 1.3,
    color: '#639922', accent: '#C0DD97', trait: 'ranged', spriteType: 'archer',
    avatarIndex: '07', traitLabel: 'Ranged',
    attackRange: 3, moveSpd: 0.4,   // rarely needs to move
    body: [[0,1,1,0],[1,1,1,1],[0,1,1,0],[0,0,1,0],[0,1,1,1]],
  },
  {
    id: 'knight', name: 'Ksatria', cost: 2, atk: 18, hp: 200, spd: 0.65,
    color: '#888780', accent: '#D3D1C7', trait: 'tank', spriteType: 'lancer',
    avatarIndex: '12', traitLabel: 'Tank',
    attackRange: 1, moveSpd: 0.4,   // slow tank
    body: [[1,1,1,1],[1,1,1,1],[0,1,1,0],[0,1,1,0],[1,1,1,1]],
  },
  {
    id: 'rogue', name: 'Pencuri', cost: 1, atk: 38, hp: 65, spd: 1.6,
    color: '#D4537E', accent: '#F4C0D1', trait: 'melee', spriteType: 'pawn',
    avatarIndex: '18', traitLabel: 'Assassin',
    attackRange: 1, moveSpd: 0.9,   // fast but still visible
    body: [[0,1,1,0],[1,1,1,1],[0,1,1,0],[1,0,0,1],[0,1,1,0]],
  },
]
