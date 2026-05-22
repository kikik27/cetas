'use client'

import Image from 'next/image'
import type { EnemyPreview } from '../game/core/types'

interface EnemyIntelProps {
  enemies: EnemyPreview[]
  round: number
}

const TRAIT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Melee:    { bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
  Ranged:   { bg: 'rgba(74,222,128,0.12)', text: '#86efac', border: 'rgba(74,222,128,0.3)' },
  Tank:     { bg: 'rgba(96,165,250,0.12)', text: '#93c5fd', border: 'rgba(96,165,250,0.3)' },
  Assassin: { bg: 'rgba(167,139,250,0.12)',text: '#c4b5fd', border: 'rgba(167,139,250,0.3)' },
}

export default function EnemyIntel({ enemies, round }: EnemyIntelProps) {
  if (!enemies.length) return null

  const totalAtk = enemies.reduce((s, e) => s + e.atk, 0)
  const threat = totalAtk > 150 ? { label: 'TINGGI', color: '#f87171' }
    : totalAtk > 80 ? { label: 'SEDANG', color: '#facc15' }
    : { label: 'RENDAH', color: '#4ade80' }

  return (
    <div className="surface-gold px-3 py-2.5 anim-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">⚠️</span>
          <span className="label">Musuh Ronde {round}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>Ancaman</span>
          <span className="text-[10px] font-black" style={{ color: threat.color }}>{threat.label}</span>
        </div>
      </div>

      {/* Enemy cards */}
      <div className="flex gap-2 scroll-x pb-0.5">
        {enemies.map((e, i) => <EnemyCard key={i} enemy={e} />)}
      </div>
    </div>
  )
}

function EnemyCard({ enemy }: { enemy: EnemyPreview }) {
  const ts = TRAIT_STYLE[enemy.traitLabel] ?? TRAIT_STYLE.Melee
  const spdLabel = enemy.spd >= 1.4 ? '⚡Fast' : enemy.spd >= 0.9 ? 'Normal' : '🐢Slow'

  return (
    <div
      className="flex-shrink-0 w-[76px] flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,90,90,0.2)' }}
    >
      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden" style={{ border: '1.5px solid rgba(255,90,90,0.3)' }}>
        <Image src={`/assets/ui/avatars/avatar-${enemy.avatarIndex}.png`} alt={enemy.name} width={64} height={64} className="pixel w-full h-full object-cover" />
        {enemy.stars > 1 && (
          <div className="absolute bottom-0 right-0 rounded-tl px-0.5 text-[7px] font-bold leading-tight" style={{ background: 'rgba(0,0,0,0.75)', color: '#fbbf24' }}>
            {'★'.repeat(enemy.stars)}
          </div>
        )}
      </div>

      <span className="text-[9px] font-bold text-center leading-tight" style={{ color: 'var(--text)' }}>{enemy.name}</span>

      <span className="text-[8px] font-bold px-1.5 py-[1px] rounded-full" style={{ background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>
        {enemy.traitLabel}
      </span>

      <div className="flex gap-1.5 text-[8px]">
        <span style={{ color: '#f87171' }}>⚔{enemy.atk}</span>
        <span style={{ color: '#f9a8d4' }}>❤{enemy.hp}</span>
      </div>
      <span className="text-[7px]" style={{ color: 'var(--text-3)' }}>{spdLabel}</span>
    </div>
  )
}
