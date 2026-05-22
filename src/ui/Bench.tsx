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
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Bangku</span>
        <span className="text-[9px] text-[var(--text-3)]">{filled}/8</span>
      </div>
      <div className="scroll-x flex flex-nowrap gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]" role="region" aria-label="Daftar bangku (geser horizontal)">
        {bench.map((unit, i) => {
          const isSel = selected?.src === 'bench' && (selected as { src: 'bench'; idx: number }).idx === i
          return <BenchSlot key={i} unit={unit} isSelected={isSel} onClick={() => onSlotClick(i)} />
        })}
      </div>
    </div>
  )
}

function BenchSlot({ unit, isSelected, onClick }: { unit: BenchSlots[number]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={unit ? `${unit.name} ⭐${unit.stars} | ATK:${unit.atkVal} HP:${unit.curHp}` : 'Kosong'}
      className={cn(
        'flex flex-shrink-0 h-[66px] w-[58px] flex-col items-center justify-center gap-0.5 rounded-xl transition-transform',
        !unit && 'border border-dashed border-white/10 bg-white/2',
        unit && !isSelected && 'border border-[rgba(74,158,255,0.3)] bg-[rgba(74,158,255,0.05)]',
        unit && isSelected && 'scale-[1.06] border-2 border-[var(--ally)] bg-[rgba(74,158,255,0.12)]'
      )}
      aria-label={unit ? `${unit.name} bintang ${unit.stars}` : 'Slot kosong'}
      aria-pressed={isSelected}
    >
      {unit ? (
        <>
          <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-[rgba(74,158,255,0.35)]">
            <Image src={`/assets/ui/avatars/avatar-${unit.avatarIndex}.png`} alt={unit.name} width={64} height={64} className="pixel h-full w-full object-cover" />
            {unit.stars > 1 && (
              <div className="absolute bottom-0 right-0 rounded-tl bg-black/75 px-0.5 text-[7px] font-bold leading-tight text-[#fbbf24]">
                {'★'.repeat(unit.stars)}
              </div>
            )}
          </div>
          <span className="px-0.5 text-center text-[8px] font-bold leading-none text-[var(--text)]">{unit.name}</span>
          <div className="flex gap-1 text-[7px]">
            <span className="inline-flex items-center gap-0.5 text-[var(--stat-atk)]"><Swords className="h-2.5 w-2.5" />{unit.atkVal}</span>
            <span className="inline-flex items-center gap-0.5 text-[var(--stat-hp)]"><Heart className="h-2.5 w-2.5" />{unit.curHp}</span>
          </div>
        </>
      ) : (
        <span className="text-[20px] text-white/8">+</span>
      )}
    </button>
  )
}

