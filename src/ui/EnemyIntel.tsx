'use client'

import Image from 'next/image'
import { AlertTriangle, Heart, Swords, Zap, Shield } from 'lucide-react'
import { cn } from '@/src/lib/utils'
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
  if (totalAtk > 150) return { label: 'TINGGI', color: 'var(--enemy)',  bg: 'var(--enemy-dim)' }
  if (totalAtk > 80)  return { label: 'SEDANG', color: 'var(--warn)',   bg: 'var(--warn-dim)' }
  return                     { label: 'RENDAH', color: 'var(--ok)',     bg: 'var(--ok-dim)' }
}

export default function EnemyIntel({ enemies, round }: EnemyIntelProps) {
  if (!enemies.length) return null

  const totalAtk = enemies.reduce((s, e) => s + e.atk, 0)
  const threat   = getThreat(totalAtk)

  return (
    <div className="relic-frame anim-fade rounded-xl px-3 py-2.5">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[var(--warn)]" />
          <span className="label">Pasukan Musuh — Ronde {round}</span>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ color: threat.color, background: threat.bg, border: `1px solid ${threat.color}40` }}
        >
          <span>⚠</span>
          <span>{threat.label}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-gold mb-2.5" />

      {/* Cards */}
      <div className="scroll-x flex gap-2 pb-1">
        {enemies.map((e, i) => <EnemyCard key={i} enemy={e} />)}
      </div>
    </div>
  )
}

function EnemyCard({ enemy }: { enemy: EnemyPreview }) {
  const ts       = TRAIT_MAP[enemy.traitLabel] ?? TRAIT_MAP.Melee
  const spdLabel = enemy.spd >= 1.4 ? 'Cepat' : enemy.spd >= 0.9 ? 'Normal' : 'Lambat'
  const spdIcon  = enemy.spd >= 1.4 ? <Zap className="h-2.5 w-2.5" /> : enemy.spd < 0.9 ? <Shield className="h-2.5 w-2.5" /> : null

  return (
    <div className={cn(
      'flex w-[80px] flex-shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5',
      'border border-[rgba(224,48,48,0.2)] bg-[rgba(224,48,48,0.04)]',
      'transition-colors hover:border-[rgba(224,48,48,0.35)] hover:bg-[rgba(224,48,48,0.08)]'
    )}>
      {/* Avatar */}
      <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-[rgba(224,48,48,0.35)] bg-[rgba(0,0,0,0.4)]">
        <Image
          src={`/assets/ui/avatars/avatar-${enemy.avatarIndex}.png`}
          alt={enemy.name}
          width={64} height={64}
          className="pixel h-full w-full object-cover"
        />
        {enemy.stars > 1 && (
          <div className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-0.5 text-[7px] font-bold leading-tight text-[#fbbf24]">
            {'★'.repeat(enemy.stars)}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-center text-[9px] font-bold leading-tight text-[var(--text-1)]">{enemy.name}</span>

      {/* Trait badge */}
      <span
        className="rounded-full px-1.5 py-[2px] text-[8px] font-bold"
        style={{ background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}
      >
        {enemy.traitLabel}
      </span>

      {/* Stats */}
      <div className="flex gap-1.5 text-[8px]">
        <span className="inline-flex items-center gap-0.5 text-[var(--stat-atk)]">
          <Swords className="h-2.5 w-2.5" />{enemy.atk}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[var(--stat-hp)]">
          <Heart className="h-2.5 w-2.5" />{enemy.hp}
        </span>
      </div>

      {/* Speed */}
      <span className="inline-flex items-center gap-0.5 text-[7px] text-[var(--text-3)]">
        {spdIcon}{spdLabel}
      </span>
    </div>
  )
}
