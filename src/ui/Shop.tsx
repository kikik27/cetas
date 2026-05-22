'use client'

import Image from 'next/image'
import type { ShopItem } from '../game/core/types'

const TRAIT_COLOR: Record<string, string> = {
  Melee: '#fca5a5', Ranged: '#86efac', Tank: '#93c5fd', Assassin: '#c4b5fd',
}

interface ShopProps {
  shop: ShopItem[]
  onBuy: (idx: number) => void
}

export default function Shop({ shop, onBuy }: ShopProps) {
  return (
    <div className="surface px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="label">Toko</span>
        <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>Tap untuk beli</span>
      </div>
      <div className="flex gap-2 scroll-x pb-0.5">
        {shop.map((item, i) => <ShopCard key={i} item={item} onBuy={() => onBuy(i)} />)}
      </div>
    </div>
  )
}

function ShopCard({ item, onBuy }: { item: ShopItem; onBuy: () => void }) {
  const tc = TRAIT_COLOR[item.traitLabel] ?? '#9ca3af'

  return (
    <button
      onClick={item.sold ? undefined : onBuy}
      disabled={item.sold}
      className="flex-shrink-0 w-[74px] flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl transition-transform"
      style={item.sold
        ? { opacity: 0.25, cursor: 'default', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }
        : { background: 'var(--bg-card)', border: '1px solid rgba(212,170,80,0.2)', cursor: 'pointer' }
      }
      aria-label={`Beli ${item.name} seharga ${item.cost} koin${item.sold ? ' (terjual)' : ''}`}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-lg overflow-hidden" style={{ border: `1.5px solid rgba(212,170,80,${item.sold ? '0.1' : '0.3'})` }}>
        <Image src={`/assets/ui/avatars/avatar-${item.avatarIndex}.png`} alt={item.name} width={64} height={64} className="pixel w-full h-full object-cover" />
      </div>

      <span className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--text)' }}>{item.name}</span>

      <span className="text-[8px] font-semibold" style={{ color: tc }}>{item.traitLabel}</span>

      <div className="flex gap-1.5 text-[8px]">
        <span style={{ color: '#f87171' }}>⚔{item.atk}</span>
        <span style={{ color: '#f9a8d4' }}>❤{item.hp}</span>
      </div>

      {/* Cost */}
      <div
        className="flex items-center gap-0.5 rounded-full px-2 py-[2px]"
        style={{ background: 'rgba(212,170,80,0.15)', border: '1px solid rgba(212,170,80,0.28)' }}
      >
        <Image src="/assets/ui/icons/icon-03.png" alt="" width={10} height={10} className="pixel" aria-hidden />
        <span className="text-[10px] font-black" style={{ color: 'var(--gold-hi)' }}>{item.cost}</span>
      </div>
    </button>
  )
}
