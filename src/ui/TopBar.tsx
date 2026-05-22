'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { GamePhase } from '../game/core/types'

interface TopBarProps {
  round: number; hp: number; gold: number
  boardUnitCount: number; maxBoardSlots: number; phase: GamePhase
}

export default function TopBar({ round, hp, gold, boardUnitCount, maxBoardSlots, phase }: TopBarProps) {
  const hpPct = Math.max(0, Math.min(100, hp))
  const hpColor = hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#f87171'
  const isPrep = phase === 'prep'

  return (
    <div className="flex items-center gap-2">
      {/* Back */}
      <Link
        href="/"
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--gold)] font-bold text-lg"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,170,80,0.25)' }}
        aria-label="Menu"
      >
        ‹
      </Link>

      {/* Title */}
      <span className="text-[11px] font-black tracking-[0.22em] uppercase" style={{ color: 'var(--gold-hi)' }}>
        Celo Tactics
      </span>

      <div className="flex-1" />

      {/* Gold */}
      <div
        className="flex items-center gap-1 rounded-lg px-2 py-1"
        style={{ background: 'rgba(212,170,80,0.1)', border: '1px solid rgba(212,170,80,0.25)' }}
      >
        <Image src="/assets/ui/icons/icon-03.png" alt="" width={12} height={12} className="pixel" aria-hidden />
        <span className="text-[13px] font-black" style={{ color: 'var(--gold-hi)' }}>{gold}</span>
      </div>

      {/* HP */}
      <div
        className="flex flex-col items-center rounded-lg px-2 py-1 min-w-[52px]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[8px]" style={{ color: 'var(--text-3)' }}>HP</span>
          <span className="text-[11px] font-black" style={{ color: hpColor }}>{hp}</span>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, background: hpColor }} />
        </div>
      </div>

      {/* Round */}
      <div
        className="flex flex-col items-center rounded-lg px-2 py-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
      >
        <span className="text-[8px]" style={{ color: 'var(--text-3)' }}>RONDE</span>
        <span className="text-[13px] font-black" style={{ color: 'var(--text)' }}>{round}/5</span>
      </div>

      {/* Phase badge */}
      <div
        className="rounded-lg px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest"
        style={isPrep
          ? { background: 'rgba(74,222,128,0.1)', color: '#86efac', border: '1px solid rgba(74,222,128,0.25)' }
          : { background: 'rgba(255,90,90,0.1)', color: '#fca5a5', border: '1px solid rgba(255,90,90,0.25)' }
        }
      >
        {isPrep ? '⚙ Prep' : '⚔ Battle'}
      </div>
    </div>
  )
}
