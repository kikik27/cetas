'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Coins, HeartPulse, Lock, Swords, Users } from 'lucide-react'
import PlayerCard   from './home/PlayerCard'
import DailyChest  from './home/DailyChest'
import QuestPreview from './home/QuestPreview'
import BottomNav   from './home/BottomNav'
import { useWallet } from '@/src/providers/WalletProvider'
import { usePlayer } from '@/src/hooks/usePlayer'

const LEAVES = [
  { src: '/assets/fx/leaf/1.png', cls: 'leaf l1', w: 18 },
  { src: '/assets/fx/leaf/3.png', cls: 'leaf l2', w: 16 },
  { src: '/assets/fx/leaf/5.png', cls: 'leaf l3', w: 20 },
  { src: '/assets/fx/leaf/2.png', cls: 'leaf l4', w: 16 },
  { src: '/assets/fx/leaf/4.png', cls: 'leaf l5', w: 14 },
  { src: '/assets/fx/leaf/6.png', cls: 'leaf l6', w: 18 },
]

export default function HomeClient() {
  const { authStatus, player: walletPlayer } = useWallet()
  const { data: queryPlayer } = usePlayer(authStatus === 'authenticated')
  const player = queryPlayer ?? walletPlayer
  const progress = player?.gameProgress
  const endlessStage = progress?.stage ?? player?.endlessStage ?? 1
  const hasProgress = Boolean(progress) || endlessStage > 1

  return (
    <div className="flex h-full flex-col gap-3">
      <PlayerCard />

      {/* ── Daily cards — 2 column ── */}
      <section className="grid grid-cols-2 gap-3">
        <DailyChest />
        <QuestPreview />
      </section>

      {/* ── Play Arena — fills remaining space ── */}
      <section className="relative flex flex-1 flex-col items-center overflow-hidden pt-2">
        {/* Falling leaves */}
        {LEAVES.map((l, i) => (
          <div key={i} className={l.cls} aria-hidden>
            <Image src={l.src} alt="" loading="lazy" width={l.w} height={20} unoptimized />
          </div>
        ))}

        {/* Arena image — upper-center, constrained size */}
        <Image
          src="/play_arena.png"
          alt="Play Arena"
          loading="eager"
          width={400}
          height={300}
          className="object-contain object-top drop-shadow-[0_8px_32px_rgba(200,146,42,0.25)]"
          style={{ width: '100%', maxHeight: 300 }}
        />

        {/* Buttons — pinned to bottom */}
        <div className="absolute bottom-10 grid w-full grid-cols-2 gap-2 px-1 pb-1">
          <Link
            href="/game"
            className="group relative overflow-hidden rounded-xl border
                       border-[var(--border-gold)] bg-[rgba(4,16,33,0.88)]
                       px-3 py-2.5 no-underline backdrop-blur-sm transition-all
                       hover:bg-[rgba(200,146,42,0.18)] hover:border-[var(--gold-hi)]
                       shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold-hi)] to-transparent opacity-70" />
            <div className="flex items-center justify-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-[var(--gold-mid)]" />
              <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
                {hasProgress ? 'Continue' : 'Endless'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span className="rounded-md border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.1)] px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                Stage {endlessStage}
              </span>
              {progress && (
                <>
                  <span className="flex items-center gap-0.5 text-[8px] font-semibold text-[var(--warn)]">
                    <Coins className="h-2.5 w-2.5" />{progress.gold}
                  </span>
                  <span className="flex items-center gap-0.5 text-[8px] font-semibold text-[var(--ok)]">
                    <HeartPulse className="h-2.5 w-2.5" />{progress.hp}
                  </span>
                </>
              )}
            </div>
          </Link>
          <div className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl
                          border border-[var(--border)] bg-[rgba(4,16,33,0.88)]
                          px-3 py-2.5 opacity-40 select-none backdrop-blur-sm
                          shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <Users className="h-3.5 w-3.5 text-[var(--text-3)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
              Multiplayer
            </span>
            <Lock className="h-2.5 w-2.5 text-[var(--text-dim)]" />
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  )
}
