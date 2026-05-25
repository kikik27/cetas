'use client'

import Image from 'next/image'
import { Heart, Swords } from 'lucide-react'
import { cn } from '@/src/lib/utils'
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
    <div className="relic-frame rounded-xl px-3 py-2.5">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Recruit Shop</span>
        <span className="text-[9px] text-[var(--text-3)]">Tap to recruit</span>
      </div>

      <div className="divider-gold mb-2.5" />

      {/* Cards */}
      <div className="scroll-x flex gap-2 pb-1">
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
        'flex flex-shrink-0 w-[78px] flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 transition-all duration-150',
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
      {/* Avatar */}
      <div className={cn(
        'h-12 w-12 overflow-hidden rounded-xl border bg-[rgba(0,0,0,0.4)]',
        item.sold
          ? 'border-[rgba(255,255,255,0.06)]'
          : 'border-[rgba(200,146,42,0.35)]'
      )}>
        <Image
          src={`/assets/ui/avatars/avatar-${item.avatarIndex}.png`}
          alt={item.name}
          width={64} height={64}
          unoptimized
          className="pixel h-full w-full object-cover"
        />
      </div>

      {/* Name */}
      <span className="text-center text-[10px] font-bold leading-tight text-[var(--text-1)]">
        {item.name}
      </span>

      {/* Trait */}
      <span
        className="rounded-full px-1.5 py-[2px] text-[8px] font-bold"
        style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
      >
        {item.traitLabel}
      </span>

      {/* Stats */}
      <div className="flex gap-1.5 text-[8px]">
        <span className="inline-flex items-center gap-0.5 text-[var(--stat-atk)]">
          <Swords className="h-2.5 w-2.5" />{item.atk}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[var(--stat-hp)]">
          <Heart className="h-2.5 w-2.5" />{item.hp}
        </span>
      </div>

      {/* Cost badge */}
      <div className="flex items-center gap-0.5 rounded-full border border-[rgba(200,146,42,0.35)] bg-[rgba(200,146,42,0.12)] px-2 py-[3px]">
        <Image src="/assets/ui/icons/icon-03.png" alt="" width={10} height={10} unoptimized className="pixel" aria-hidden />
        <span className="font-display text-[11px] font-bold text-[var(--gold-hi)]">{item.cost}</span>
      </div>
    </button>
  )
}
