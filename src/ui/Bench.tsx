'use client'

import Image from 'next/image'
import { Heart, Swords } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import type { BenchSlots, SelectedSource } from '../game/core/types'

interface BenchProps {
  bench: BenchSlots
  selected: SelectedSource
  onSlotClick: (idx: number) => void
}

export default function Bench({ bench, selected, onSlotClick }: BenchProps) {
  const filled = bench.filter(Boolean).length

  return (
    <div className="relic-frame rounded-xl px-3 py-2.5">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Reserve Bench</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {bench.map((u, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  u ? 'bg-[var(--ally)]' : 'bg-[rgba(255,255,255,0.1)]'
                )}
              />
            ))}
          </div>
          <span className="text-[9px] text-[var(--text-3)]">{filled}/8</span>
        </div>
      </div>

      <div className="divider-gold mb-2" />

      {/* Slots */}
      <div
        className="scroll-x flex flex-nowrap gap-1.5 pb-1"
        role="region"
        aria-label="Reserve bench (scroll horizontally)"
      >
        {bench.map((unit, i) => {
          const isSel = selected?.src === 'bench' && (selected as { src: 'bench'; idx: number }).idx === i
          return (
            <BenchSlot
              key={i}
              unit={unit}
              isSelected={isSel}
              onClick={() => onSlotClick(i)}
            />
          )
        })}
      </div>
    </div>
  )
}

function BenchSlot({
  unit,
  isSelected,
  onClick,
}: {
  unit: BenchSlots[number]
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={unit ? `${unit.name} ⭐${unit.stars} | ATK:${unit.atkVal} HP:${unit.curHp}` : 'Empty'}
      className={cn(
        'flex flex-shrink-0 h-[72px] w-[62px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150',
        !unit && [
          'border border-dashed border-[rgba(200,146,42,0.15)] bg-[rgba(255,255,255,0.02)]',
          'hover:border-[rgba(200,146,42,0.3)] hover:bg-[rgba(200,146,42,0.04)]',
        ],
        unit && !isSelected && [
          'border border-[rgba(74,158,255,0.25)] bg-[rgba(74,158,255,0.04)]',
          'hover:border-[rgba(74,158,255,0.45)] hover:bg-[rgba(74,158,255,0.08)]',
        ],
        unit && isSelected && [
          'scale-[1.06] border-2 border-[var(--ally)] bg-[rgba(74,158,255,0.12)]',
          'shadow-[0_0_12px_rgba(74,158,255,0.3)]',
        ],
      )}
      aria-label={unit ? `${unit.name} star ${unit.stars}` : 'Empty slot'}
      aria-pressed={isSelected}
    >
      {unit ? (
        <>
          {/* Avatar */}
          <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-[rgba(74,158,255,0.3)] bg-[rgba(0,0,0,0.4)]">
            <Image
              src={`/assets/ui/avatars/avatar-${unit.avatarIndex}.png`}
              alt={unit.name}
              width={64} height={64}
              className="pixel h-full w-full object-cover"
            />
            {unit.stars > 1 && (
              <div className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-0.5 text-[7px] font-bold leading-tight text-[#fbbf24]">
                {'★'.repeat(unit.stars)}
              </div>
            )}
          </div>

          {/* Name */}
          <span className="px-0.5 text-center text-[8px] font-bold leading-none text-[var(--text-1)]">
            {unit.name}
          </span>

          {/* Stats */}
          <div className="flex gap-1 text-[7px]">
            <span className="inline-flex items-center gap-0.5 text-[var(--stat-atk)]">
              <Swords className="h-2 w-2" />{unit.atkVal}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[var(--stat-hp)]">
              <Heart className="h-2 w-2" />{unit.curHp}
            </span>
          </div>
        </>
      ) : (
        <span className="text-[18px] text-[rgba(200,146,42,0.15)]">+</span>
      )}
    </button>
  )
}
