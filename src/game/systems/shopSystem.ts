// Shop logic — pure functions, no rendering, no React
import { UNIT_DEFS } from '../entities/unitDefs'
import { makeUnit } from '../core/unitFactory'
import type { ShopItem, BenchSlots, Unit } from '../core/types'

export function generateShop(): ShopItem[] {
  const pool = [...UNIT_DEFS, ...UNIT_DEFS, ...UNIT_DEFS]
  const shop: ShopItem[] = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    const def = pool.splice(idx, 1)[0]
    shop.push({ ...def, sold: false })
  }
  return shop
}

export interface MergeResult {
  bench: BenchSlots
  mergeLog: string[]
}

/** Recursively check for 3-of-a-kind on bench and merge them */
export function checkMerge(bench: BenchSlots): MergeResult {
  const mergeLog: string[] = []
  let changed = true

  // Work on a mutable copy
  const b: BenchSlots = [...bench]

  while (changed) {
    changed = false
    const counts: Record<string, { idxs: number[]; unit: Unit }> = {}

    b.forEach((u, i) => {
      if (!u) return
      const key = `${u.id}_${u.stars}`
      if (!counts[key]) counts[key] = { idxs: [], unit: u }
      counts[key].idxs.push(i)
    })

    for (const key in counts) {
      const { idxs, unit } = counts[key]
      if (idxs.length >= 3 && unit.stars < 3) {
        const newStars = (unit.stars + 1) as 1 | 2 | 3
        const def = UNIT_DEFS.find(d => d.id === unit.id)!
        const newUnit = makeUnit(def, newStars)
        // Clear the 3 slots
        idxs.slice(0, 3).forEach(i => { b[i] = null })
        // Place merged unit in first free slot
        const free = b.indexOf(null)
        if (free >= 0) b[free] = newUnit
        else b[idxs[0]] = newUnit
        mergeLog.push(`✨ Merge! ${unit.name} ⭐${newStars} muncul!`)
        changed = true
        break
      }
    }
  }

  return { bench: b, mergeLog }
}

export interface BuyResult {
  bench: BenchSlots
  gold: number
  shopItem: ShopItem
  log: string
  error?: string
}

export function buyUnit(
  shopItem: ShopItem,
  bench: BenchSlots,
  gold: number,
): BuyResult {
  if (shopItem.sold) return { bench, gold, shopItem, log: '', error: 'Sudah terjual' }
  if (gold < shopItem.cost) return { bench, gold, shopItem, log: '', error: '🪙 Koin tidak cukup!' }

  const free = bench.indexOf(null)
  if (free < 0) return { bench, gold, shopItem, log: '', error: '⚠️ Bangku penuh! Jual unit dulu.' }

  const def = UNIT_DEFS.find(d => d.id === shopItem.id)!
  const newBench = [...bench]
  newBench[free] = makeUnit(def)

  return {
    bench: newBench,
    gold: gold - shopItem.cost,
    shopItem: { ...shopItem, sold: true },
    log: `🛒 Beli ${shopItem.name} −🪙${shopItem.cost}`,
  }
}
