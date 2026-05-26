'use client'

import Image from 'next/image'
import { Trophy, Swords, Shield, Flame, Medal, Star, Users } from 'lucide-react'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { useWallet } from '@/src/providers/WalletProvider'
import BottomNav from '@/src/ui/home/BottomNav'
import { cn } from '@/src/lib/utils'

const TIER_COLORS: Record<string, string> = {
  Mythic:      'text-[#ff80ff] border-[rgba(255,128,255,0.3)] bg-[rgba(255,128,255,0.08)]',
  Grandmaster: 'text-[var(--gold-hi)] border-[rgba(200,146,42,0.4)] bg-[rgba(200,146,42,0.1)]',
  Diamond:     'text-[#a0d8ff] border-[rgba(160,216,255,0.3)] bg-[rgba(160,216,255,0.08)]',
  Platinum:    'text-[#c0e0c0] border-[rgba(192,224,192,0.3)] bg-[rgba(192,224,192,0.06)]',
  Gold:        'text-[var(--warn)] border-[rgba(224,128,32,0.3)] bg-[rgba(224,128,32,0.08)]',
  Bronze:      'text-[#c8906a] border-[rgba(200,144,106,0.3)] bg-[rgba(200,144,106,0.06)]',
}

const RANK_STYLES = [
  'text-[var(--gold-hi)] drop-shadow-[0_0_8px_rgba(245,216,120,0.8)]',
  'text-[#c0c8d8] drop-shadow-[0_0_6px_rgba(192,200,216,0.6)]',
  'text-[#c8906a] drop-shadow-[0_0_6px_rgba(200,144,106,0.6)]',
]

export default function LeaderboardClient() {
  const { player } = useWallet()
  const { data, isLoading, isFetching } = useLeaderboard()

  const leaderboard = data?.leaderboard ?? []
  const myRank      = data?.myRank ?? null
  const topStreak   = leaderboard.reduce((best, p) => Math.max(best, p.streak), 0)

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)]">
          <Image src="/assets/ui/leaderboard.png" alt="" width={18} height={18} loading="eager" unoptimized className="pixel object-contain" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-[15px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
            Leaderboard
          </h1>
          <p className="text-[10px] text-[var(--text-3)]">
            {isFetching && !isLoading ? 'Syncing ranks...' : 'Hall of Champions'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-[13px] font-bold text-[var(--gold-hi)]">
            {myRank ? `#${myRank}` : '—'}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">your rank</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid flex-shrink-0 grid-cols-3 gap-2">
        {[
          { icon: <Trophy className="h-4 w-4 text-[var(--gold-hi)]" />, label: 'Top Points', value: leaderboard[0]?.score.toLocaleString() ?? '-' },
          { icon: <Swords className="h-4 w-4 text-[var(--enemy)]" />,  label: 'Best Streak', value: topStreak ? topStreak.toString() : '-' },
          { icon: <Shield className="h-4 w-4 text-[var(--ally)]" />,   label: 'Players',     value: leaderboard.length.toString() },
        ].map(s => (
          <div key={s.label} className="relic-frame flex flex-col items-center gap-1 px-2 py-3">
            {s.icon}
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">{s.label}</p>
            <p className="font-display text-[14px] font-bold text-[var(--text-1)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Player list */}
      <div className="relic-frame game-scroll flex flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden p-0">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[60px] animate-pulse border-b border-[var(--border)] bg-[rgba(11,78,162,0.05)]" />
          ))
        ) : leaderboard.length === 0 ? (
          <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(200,146,42,0.25)] bg-[rgba(200,146,42,0.08)]">
              <Users className="h-5 w-5 text-[var(--gold-hi)]" />
            </div>
            <div>
              <p className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--text-1)]">
                No ranked players yet
              </p>
              <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-[var(--text-3)]">
                Earn points or keep a login streak to appear here.
              </p>
            </div>
          </div>
        ) : (
          leaderboard.map((p, i) => {
              const isMe      = p.playerId === player?.id
              const rankStyle = RANK_STYLES[i] ?? 'text-[var(--text-3)]'
              const tierStyle = TIER_COLORS[p.tier] ?? 'text-[var(--text-3)] border-[var(--border)] bg-transparent'
              const pad       = String(p.avatarIdx).padStart(2, '0')

              return (
                <div
                  key={p.playerId}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    'border-b border-[var(--border)] last:border-b-0',
                    isMe ? 'bg-[rgba(200,146,42,0.07)]' : 'hover:bg-white/[0.02]'
                  )}
                >
                  <span className={cn('w-7 flex-shrink-0 text-center font-display text-[14px] font-bold', rankStyle)}>
                    {i === 0 && <Trophy className="h-4 w-4 inline text-[var(--gold-hi)]" />}
                    {i === 1 && <Medal  className="h-4 w-4 inline text-[#c0c8d8]" />}
                    {i === 2 && <Star   className="h-4 w-4 inline text-[#c8906a]" />}
                    {i >= 3  && `${i + 1}`}
                  </span>
                  <Image
                    src={`/assets/ui/avatars/avatar-${pad}.png`}
                    alt="" aria-hidden
                    width={32} height={32}
                    unoptimized
                    className="pixel flex-shrink-0 rounded-lg border border-[var(--border)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'truncate font-display text-[12px] font-bold uppercase tracking-wider',
                      isMe ? 'text-[var(--gold-hi)]' : 'text-[var(--text-1)]'
                    )}>
                      {p.name}{isMe && ' (You)'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn('rounded-md border px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wider', tierStyle)}>
                        {p.tier}
                      </span>
                      {p.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-[var(--warn)]">
                          <Flame className="h-2.5 w-2.5" />{p.streak}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-display text-[13px] font-bold tabular-nums text-[var(--gold-hi)]">
                      {p.score.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-[var(--text-3)]">Stage {p.wins + 1}</p>
                  </div>
                </div>
              )
            })
        )}
      </div>

      <BottomNav />
    </div>
  )
}
