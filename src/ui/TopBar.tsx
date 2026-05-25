'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { Swords, Shield } from 'lucide-react'
import type { GamePhase } from '../game/core/types'

interface TopBarProps {
  round: number
  hp: number
  gold: number
  boardUnitCount: number
  maxBoardSlots: number
  phase: GamePhase
}

export default function TopBar({ round, hp, gold, boardUnitCount, maxBoardSlots, phase }: TopBarProps) {
  const hpPct   = Math.max(0, Math.min(100, hp))
  const hpColor = hpPct > 50 ? 'var(--ok)' : hpPct > 25 ? 'var(--warn)' : 'var(--enemy)'
  const isPrep  = phase === 'prep'

  return (
    <div className="relic-frame flex items-center gap-2 rounded-xl px-3 py-2">

      {/* ── Back button ── */}
      <Link
        href="/"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-gold)] bg-[rgba(200,146,42,0.08)] text-[var(--gold-mid)] transition-colors hover:bg-[rgba(200,146,42,0.16)]"
        aria-label="Back to menu"
      >
        <span className="text-base font-bold leading-none">‹</span>
      </Link>

      {/* ── Title ── */}
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-gold-gradient hidden xs:block">
        CETAS
      </span>

      <div className="flex-1" />

      {/* ── Gold ── */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)] px-2.5 py-1.5">
        <Image src="/assets/ui/icons/icon-03.png" alt="" width={14} height={14} unoptimized className="pixel" aria-hidden />
        <span className="font-display text-[14px] font-bold text-[var(--gold-hi)]">{gold}</span>
      </div>

      {/* ── HP ── */}
      <div className="flex min-w-[60px] flex-col gap-0.5 rounded-lg border border-[var(--border)] bg-[rgba(4,16,33,0.6)] px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 flex-shrink-0" style={{ color: hpColor }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-3)]">HP</span>
          </div>
          <span className="font-display text-[13px] font-bold tabular-nums" style={{ color: hpColor }}>{hp}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(11,78,162,0.25)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 6px ${hpColor}` }}
          />
        </div>
      </div>

      {/* ── Round ── */}
      <div className="flex flex-col items-center rounded-lg border border-[var(--border)] bg-[rgba(4,16,33,0.6)] px-2.5 py-1.5">
        <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-3)]">Round</span>
        <span className="font-display text-[13px] font-bold text-[var(--text-1)]">{round}<span className="text-[10px] text-[var(--text-3)]">/5</span></span>
      </div>

      {/* ── Slots ── */}
      <div className="flex flex-col items-center rounded-lg border border-[var(--border)] bg-[rgba(4,16,33,0.6)] px-2.5 py-1.5">
        <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-3)]">Slots</span>
        <span className="font-display text-[13px] font-bold text-[var(--ally)]">{boardUnitCount}<span className="text-[10px] text-[var(--text-3)]">/{maxBoardSlots}</span></span>
      </div>

      {/* ── Phase badge ── */}
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest',
          isPrep
            ? 'border bg-[var(--prep-bg)] text-[var(--prep-text)] border-[var(--prep-border)]'
            : 'border bg-[var(--battle-bg)] text-[var(--battle-text)] border-[var(--battle-border)]'
        )}
      >
        {isPrep
          ? <><Shield className="h-3 w-3" />Prep</>
          : <><Swords className="h-3 w-3" />Battle</>
        }
      </div>
    </div>
  )
}
