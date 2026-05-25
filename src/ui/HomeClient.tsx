'use client'

import Link from 'next/link'
import { Swords, Trophy, Star, Shield, Lock } from 'lucide-react'
import PlayerCard   from './home/PlayerCard'
import DailyChest  from './home/DailyChest'
import QuestPreview from './home/QuestPreview'
import BottomNav   from './home/BottomNav'

export default function HomeClient() {
  return (
    <>
      <PlayerCard />

      {/* ── Quick action cards ── */}
      <section className="grid grid-cols-2 gap-3">
        
      </section>

      {/* ── Daily cards — 2 column ── */}
      <section className="grid grid-cols-2 gap-3">
        <DailyChest />
        <QuestPreview />
      </section>

      <BottomNav />
    </>
  )
}

// ── Sub-components (small, local-only) ────────────────────────────────────────

interface ActionCardProps {
  href:        string
  iconBg:      string
  iconBorder:  string
  icon:        React.ReactNode
  title:       string
  sub:         string
}

function ActionCard({ href, iconBg, iconBorder, icon, title, sub }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-2 rounded-2xl border border-[var(--border)]
                 bg-gradient-to-br from-[rgba(26,18,42,0.94)] to-[rgba(16,11,28,0.98)]
                 px-4 py-4 no-underline shadow-[0_4px_20px_rgba(0,0,0,0.45)]
                 transition-all hover:border-[var(--border-gold)]
                 hover:shadow-[0_6px_24px_rgba(0,0,0,0.55),0_0_20px_rgba(200,146,42,0.07)]"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconBg} ${iconBorder}`}>
        {icon}
      </div>
      <div>
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--text-1)]">
          {title}
        </p>
        <p className="text-[10px] text-[var(--text-3)]">{sub}</p>
      </div>
      <span className="absolute right-3.5 top-3.5 text-lg leading-none text-[var(--text-3)]
                       transition-colors group-hover:text-[var(--gold-mid)]">
        ›
      </span>
    </Link>
  )
}

function LockedCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex cursor-not-allowed items-center gap-2 rounded-xl
                    border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 opacity-40">
      {icon}
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]">
        {label}
      </span>
      <Lock className="ml-auto h-3 w-3 text-[var(--text-dim)]" />
    </div>
  )
}
