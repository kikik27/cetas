'use client'

import Image from 'next/image'
import { Heart, Swords } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { UI } from '@/src/lib/assetPaths'
import AvatarImage from '@/src/components/ui/AvatarImage'
import StatBadge from '@/src/components/ui/StatBadge'
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
    <div className="relic-frame rounded-xl px-2.5 py-2">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label">Recruit Shop</span>
        <span className="text-[8px] text-[var(--text-3)]">Tap to recruit</span>
      </div>

      <div className="divider-gold mb-1.5" />

      {/* Cards */}
      <div className="scroll-x flex gap-1.5 pb-0.5">
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
        'relative flex w-[66px] flex-shrink-0 flex-col items-center gap-1 overflow-hidden rounded-xl px-1.5 pb-1.5 pt-2 transition-all duration-150',
        item.sold
          ? 'cursor-default border border-[rgba(255,255,255,0.05)] bg-[rgba(4,16,33,0.5)] opacity-30'
          : [
              'cursor-pointer border border-[rgba(200,146,42,0.2)] bg-[rgba(8,28,58,0.6)]',
              'hover:border-[rgba(200,146,42,0.45)] hover:bg-[rgba(200,146,42,0.09)]',
              'active:scale-95 active:brightness-90',
            ]
      )}
      aria-label={`Recruit ${item.name} for ${item.cost} gold${item.sold ? ' (recruited)' : ''}`}
    >
      {/* Cost badge */}
      <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-full border border-[rgba(200,146,42,0.45)] bg-[rgba(4,16,33,0.88)] px-1 py-[1px] shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
        <Image src={UI.goldIcon} alt="" width={8} height={8} unoptimized className="pixel" aria-hidden />
        <span className="font-display text-[9px] font-bold text-[var(--gold-hi)]">{item.cost}</span>
      </div>

      {/* Avatar */}
      <div className={cn(
        'h-9 w-9 overflow-hidden rounded-lg border bg-[rgba(0,0,0,0.4)]',
        item.sold ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(200,146,42,0.35)]'
      )}>
        <AvatarImage idx={item.avatarIndex} size={36} />
      </div>

      {/* Name */}
      <span className="max-w-full truncate text-center text-[8px] font-bold leading-tight text-[var(--text-1)]">
        {item.name}
      </span>

      {/* Trait */}
      <span
        className="rounded-full px-1 py-[1px] text-[7px] font-bold"
        style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
      >
        {item.traitLabel}
      </span>

      {/* Stats */}
      <div className="hidden gap-1 text-[7px] min-[390px]:flex">
        <StatBadge icon={Swords} value={item.atk} colorClass="text-[var(--stat-atk)]" />
        <StatBadge icon={Heart}  value={item.hp}  colorClass="text-[var(--stat-hp)]" />
      </div>

    </button>
  )
}
