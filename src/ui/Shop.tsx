'use client'

import Image from 'next/image'
import { cn } from '@/src/lib/utils'
import { UI } from '@/src/lib/assetPaths'
import AvatarImage from '@/src/components/ui/AvatarImage'
import type { ShopItem } from '../game/core/types'

const TRAIT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Melee:    { text: 'var(--trait-melee)',    bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.28)' },
  Ranged:   { text: 'var(--trait-ranged)',   bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.28)' },
  Tank:     { text: 'var(--trait-tank)',     bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.28)' },
  Assassin: { text: 'var(--trait-assassin)', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.28)' },
}

interface ShopProps {
  shop: ShopItem[]
  onBuy: (idx: number) => void
}

export default function Shop({ shop, onBuy }: ShopProps) {
  return (
    <div className="relic-frame rounded-xl px-2.5 py-1.5">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <span className="label">Recruit Shop</span>
        <span className="text-[8px] text-[var(--text-3)]">Tap to recruit</span>
      </div>

      <div className="divider-gold mb-1" />

      {/* Cards */}
      <div className="scroll-x flex gap-1.5 pb-0">
        {shop.map((item, i) => (
          <ShopCard key={i} item={item} onBuy={() => onBuy(i)} />
        ))}
      </div>
    </div>
  )
}

function ShopCard({ item, onBuy }: { item: ShopItem; onBuy: () => void }) {
  const tc = TRAIT_COLORS[item.traitLabel] ?? TRAIT_COLORS.Melee

  return (
    <button
      onClick={item.sold ? undefined : onBuy}
      disabled={item.sold}
      className={cn(
        'relative flex h-[54px] w-[56px] flex-shrink-0 flex-col items-center justify-end gap-0.5 overflow-hidden rounded-xl px-1 pb-1.5 pt-2 transition-all duration-150 min-[390px]:w-[60px]',
        item.sold
          ? 'cursor-default border border-[rgba(255,255,255,0.05)] bg-[rgba(4,16,33,0.5)] opacity-30'
          : [
              'cursor-pointer border border-[rgba(200,146,42,0.2)] bg-[rgba(8,28,58,0.6)]',
              'hover:border-[rgba(200,146,42,0.45)] hover:bg-[rgba(200,146,42,0.09)]',
              'active:scale-95 active:brightness-90',
            ]
      )}
      aria-label={`Recruit ${item.name}, ${item.traitLabel}, for ${item.cost} gold${item.sold ? ' (recruited)' : ''}`}
    >
      {/* Cost badge */}
      <div className="absolute right-0.5 top-0.5 z-10 flex items-center gap-0.5 rounded-full border border-[rgba(200,146,42,0.45)] bg-[rgba(4,16,33,0.9)] px-1 py-[1px] shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
        <Image src={UI.goldIcon} alt="" width={8} height={8} unoptimized className="pixel" aria-hidden />
        <span className="font-display text-[8px] font-bold text-[var(--gold-hi)]">{item.cost}</span>
      </div>

      {/* Avatar */}
      <div className={cn(
        'h-7 w-7 overflow-hidden rounded-lg border bg-[rgba(0,0,0,0.4)]',
        item.sold ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(200,146,42,0.35)]'
      )}>
        <AvatarImage idx={item.avatarIndex} size={28} />
      </div>

      {/* Name */}
      <span className="max-w-full truncate text-center text-[7px] font-bold leading-none text-[var(--text-1)]">
        {item.name}
      </span>

      <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full" style={{ background: tc.text }} />

    </button>
  )
}
