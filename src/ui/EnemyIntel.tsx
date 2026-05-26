'use client'

import Image from 'next/image'
import { AlertTriangle, Heart, Swords } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { avatarSrc } from '@/src/lib/assetPaths'
import type { EnemyPreview } from '../game/core/types'

interface EnemyIntelProps {
  enemies: EnemyPreview[]
  round: number
}

const TRAIT_MAP: Record<string, { text: string; bg: string; border: string }> = {
  Melee:    { text: 'var(--trait-melee)',    bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)' },
  Ranged:   { text: 'var(--trait-ranged)',   bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.3)' },
  Tank:     { text: 'var(--trait-tank)',     bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.3)' },
  Assassin: { text: 'var(--trait-assassin)', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.3)' },
}

function getThreat(totalAtk: number) {
  if (totalAtk > 150) return { label: 'HIGH',   color: 'var(--enemy)', bg: 'var(--enemy-dim)' }
  if (totalAtk > 80)  return { label: 'MEDIUM', color: 'var(--warn)',  bg: 'var(--warn-dim)' }
  return                     { label: 'LOW',    color: 'var(--ok)',    bg: 'var(--ok-dim)' }
}

export default function EnemyIntel({ enemies, round }: EnemyIntelProps) {
  if (!enemies.length) return null

  const totalAtk = enemies.reduce((s, e) => s + e.atk, 0)
  const threat   = getThreat(totalAtk)

  return (
    <div className="relic-frame anim-fade flex h-full flex-col rounded-xl px-2.5 py-1.5">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[var(--warn)]" />
          <span className="label">Enemy Stage {round}</span>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
          style={{ color: threat.color, background: threat.bg, border: `1px solid ${threat.color}40` }}
        >
          <span>{threat.label}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-gold mb-1" />

      {/* Cards */}
      <div className="scroll-x flex min-h-0 flex-1 gap-1.5 pb-0">
        {enemies.map((e, i) => <EnemyCard key={i} enemy={e} />)}
      </div>
    </div>
  )
}

function EnemyCard({ enemy }: { enemy: EnemyPreview }) {
  const ts = TRAIT_MAP[enemy.traitLabel] ?? TRAIT_MAP.Melee

  return (
    <div
      className={cn(
        'game-intel-card relative flex w-[116px] flex-shrink-0 items-center gap-2 overflow-hidden rounded-xl px-2 pb-2 pt-1.5 min-[390px]:w-[124px]',
        'border border-[rgba(224,48,48,0.2)] bg-[rgba(224,48,48,0.04)]',
        'transition-colors hover:border-[rgba(224,48,48,0.35)] hover:bg-[rgba(224,48,48,0.08)]'
      )}
      role="group"
      aria-label={`${enemy.name}, ${enemy.traitLabel}, attack and health hidden`}
    >
      {/* Avatar */}
      <div className="game-intel-avatar relative flex-shrink-0 rounded-lg border border-[rgba(224,48,48,0.35)] bg-[rgba(0,0,0,0.4)] p-0.5">
        <Image
          src={avatarSrc(enemy.avatarIndex)}
          alt=""
          aria-hidden
          width={32}
          height={32}
          unoptimized
          className="pixel h-full w-full object-contain"
        />
        {enemy.stars > 1 && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-tl bg-black/85 px-0.5 text-[7px] font-bold leading-tight text-[#fbbf24]">
            {'★'.repeat(enemy.stars)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex flex-1 flex-col gap-1">
        {/* Name */}
        <span className="whitespace-normal break-words text-left text-[8px] font-bold leading-[9px] text-[var(--text-1)]">
          {enemy.name}
        </span>

        <span
          className="game-card-chip w-fit max-w-full rounded-full px-1 py-[1px] text-[6px] font-bold leading-none"
          style={{ background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}
        >
          {enemy.traitLabel}
        </span>

        {/* Stats */}
        <div className="flex gap-0.5 text-[6px] leading-none">
          <span className="flex items-center gap-0.5 rounded border border-[rgba(224,48,48,0.24)] bg-[rgba(224,48,48,0.08)] px-1 py-0.5 font-bold text-[var(--stat-atk)]">
            <Swords className="h-2 w-2" />???
          </span>
          <span className="flex items-center gap-0.5 rounded border border-[rgba(61,186,106,0.24)] bg-[rgba(61,186,106,0.08)] px-1 py-0.5 font-bold text-[var(--stat-hp)]">
            <Heart className="h-2 w-2" />???
          </span>
        </div>
      </div>

      <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full" style={{ background: ts.text }} />
    </div>
  )
}
