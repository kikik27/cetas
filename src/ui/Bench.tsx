'use client'

import Image from 'next/image'
import type { BenchSlots, SelectedSource } from '../game/core/types'

interface BenchProps {
  bench: BenchSlots
  selected: SelectedSource
  onSlotClick: (idx: number) => void
}

export default function Bench({ bench, selected, onSlotClick }: BenchProps) {
  const filled = bench.filter(Boolean).length

  return (
    <div className="surface px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="label">Bangku</span>
        <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>{filled}/8</span>
      </div>
      <div className="flex gap-1.5 scroll-x pb-0.5">
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
      className="flex-shrink-0 w-[58px] h-[66px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-transform"
      style={unit
        ? isSelected
          ? { border: '2px solid var(--ally)', background: 'rgba(74,158,255,0.12)', transform: 'scale(1.06)' }
          : { border: '1px solid rgba(74,158,255,0.3)', background: 'rgba(74,158,255,0.05)' }
        : { border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }
      }
      aria-label={unit ? `${unit.name} bintang ${unit.stars}` : 'Slot kosong'}
      aria-pressed={isSelected}
    >
      {unit ? (
        <>
          <div className="relative w-9 h-9 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(74,158,255,0.35)' }}>
            <Image src={`/assets/ui/avatars/avatar-${unit.avatarIndex}.png`} alt={unit.name} width={64} height={64} className="pixel w-full h-full object-cover" />
            {unit.stars > 1 && (
              <div className="absolute bottom-0 right-0 rounded-tl px-0.5 text-[7px] font-bold leading-tight" style={{ background: 'rgba(0,0,0,0.75)', color: '#fbbf24' }}>
                {'★'.repeat(unit.stars)}
              </div>
            )}
          </div>
          <span className="text-[8px] font-bold text-center leading-none px-0.5" style={{ color: 'var(--text)' }}>{unit.name}</span>
          <div className="flex gap-1 text-[7px]">
            <span style={{ color: '#f87171' }}>⚔{unit.atkVal}</span>
            <span style={{ color: '#f9a8d4' }}>❤{unit.curHp}</span>
          </div>
        </>
      ) : (
        <span className="text-[20px]" style={{ color: 'rgba(255,255,255,0.08)' }}>+</span>
      )}
    </button>
  )
}
