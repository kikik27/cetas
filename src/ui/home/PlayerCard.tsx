'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Crown, Flame } from 'lucide-react'
import { useHomeStore } from '@/src/lib/homeStore'
import AvatarPicker from './AvatarPicker'

export default function PlayerCard() {
  const { playerName, avatarIdx, totalPoints, streakDays, level, setAvatarIdx } = useHomeStore()
  const [pickerOpen, setPickerOpen] = useState(false)

  const xpForNext  = level * 500
  const xpCurrent  = totalPoints % xpForNext
  const xpPct      = Math.min(100, Math.round((xpCurrent / xpForNext) * 100))
  const pad        = String(avatarIdx).padStart(2, '0')

  return (
    <>
      <AvatarPicker
        open={pickerOpen}
        current={avatarIdx}
        onClose={() => setPickerOpen(false)}
        onSelect={setAvatarIdx}
      />

      <section className="relic-frame flex items-center gap-3 px-4 py-4">
        {/* Avatar button */}
        <button
          onClick={() => setPickerOpen(true)}
          aria-label="Change avatar"
          className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl
                     border-2 border-[var(--border-gold)] transition-colors
                     hover:border-[var(--gold-hi)]"
        >
          <Image
            src={`/assets/ui/avatars/avatar-${pad}.png`}
            alt="Player avatar"
            width={64} height={64}
            loading="eager"
            unoptimized
            className="pixel h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center
                          bg-black/0 transition-colors group-hover:bg-black/40">
            <span className="font-display text-[9px] font-bold uppercase tracking-wider
                             text-[var(--gold-hi)] opacity-0 transition-opacity group-hover:opacity-100">
              Edit
            </span>
          </div>
        </button>

        {/* Name + XP */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Crown className="h-3 w-3 flex-shrink-0 text-[var(--gold-mid)]" />
            <span className="font-display text-[10px] uppercase tracking-wider text-[var(--gold-mid)]">
              Level {level}
            </span>
          </div>
          <p className="truncate font-display text-[16px] font-bold leading-tight text-[var(--text-1)]">
            {playerName}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="stat-bar flex-1">
              <div
                className="stat-bar-fill bg-gradient-to-r from-[var(--gold-lo)] to-[var(--gold-hi)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="flex-shrink-0 tabular-nums text-[9px] text-[var(--text-3)]">
              {xpCurrent}/{xpForNext} xp
            </span>
          </div>
        </div>

        {/* Points badge */}
        <div className="flex min-w-[64px] flex-shrink-0 flex-col items-center gap-0.5
                        rounded-xl border border-[var(--border-gold)]
                        bg-[rgba(200,146,42,0.08)] px-3 py-2.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
            Points
          </span>
          <span className="font-display text-[17px] font-bold leading-none tabular-nums text-[var(--gold-hi)]">
            {totalPoints.toLocaleString()}
          </span>
          <div className="mt-0.5 flex items-center gap-0.5">
            <Flame className="h-2.5 w-2.5 text-[var(--warn)]" />
            <span className="text-[9px] text-[var(--warn)]">{streakDays}d</span>
          </div>
        </div>
      </section>
    </>
  )
}
