'use client'

import React from 'react'
import {
  Swords, Shield, Trophy, Zap, Star, Flame,
  CheckCircle2, Circle, Loader2,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import type { TaskIconId, DailyTaskDef } from '@/src/lib/homeStore'

const ICONS: Record<TaskIconId, (p: LucideProps) => React.ReactElement> = {
  swords: p => <Swords {...p} />,
  shield: p => <Shield {...p} />,
  trophy: p => <Trophy {...p} />,
  zap:    p => <Zap    {...p} />,
  star:   p => <Star   {...p} />,
  flame:  p => <Flame  {...p} />,
}

interface Props {
  def:       DailyTaskDef
  progress:  number
  done:      boolean
  claimedAt: string | null
  onClaim:   () => void
  claiming?: boolean
}

export default function TaskItem({ def, progress, done, claimedAt, onClaim, claiming }: Props) {
  const canClaim = progress >= def.total && !done && !claimedAt
  const pct      = Math.min(100, Math.round((progress / def.total) * 100))
  const Icon     = ICONS[def.iconId]

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all',
      done     ? 'border-[rgba(61,186,106,0.2)] bg-[rgba(4,16,33,0.75)] opacity-60'
      : canClaim ? 'border-[var(--border-gold)] bg-[rgba(8,28,58,0.88)]'
                 : 'border-[var(--border)] bg-[rgba(4,16,33,0.75)]'
    )}>
      {/* Icon */}
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border',
        done     ? 'border-[rgba(61,186,106,0.3)] bg-[rgba(61,186,106,0.1)] text-[var(--ok)]'
        : canClaim ? 'border-[var(--border-gold)] bg-[rgba(200,146,42,0.12)] text-[var(--gold-mid)]'
                   : 'border-[var(--border)] bg-[rgba(11,78,162,0.15)] text-[var(--text-3)]'
      )}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'font-display text-[11px] font-bold uppercase tracking-wider leading-tight',
            done ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'
          )}>
            {def.label}
          </p>
          <span className={cn(
            'flex-shrink-0 font-display text-[10px] font-bold',
            done ? 'text-[var(--ok)]' : 'text-[var(--gold-mid)]'
          )}>
            +{def.reward} XP
          </span>
        </div>

        {def.total > 1 && !done && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="stat-bar flex-1" style={{ height: 4 }}>
              <div
                className="stat-bar-fill bg-gradient-to-r from-[var(--ally)] to-[#a0d8ff]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="flex-shrink-0 tabular-nums text-[9px] text-[var(--text-3)]">
              {progress}/{def.total}
            </span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-[var(--ok)]" />
        ) : canClaim ? (
          <button
            onClick={onClaim}
            disabled={claiming}
            className="rounded-lg border border-[var(--border-gold)] bg-[rgba(200,146,42,0.14)]
                       px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-wider
                       text-[var(--gold-hi)] transition-all hover:bg-[rgba(200,146,42,0.24)]
                       disabled:opacity-50"
          >
            {claiming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Claim'}
          </button>
        ) : (
          <Circle className="h-4 w-4 text-[var(--text-dim)]" />
        )}
      </div>
    </div>
  )
}
