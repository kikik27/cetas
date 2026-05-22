import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { Card, CardContent } from '@/src/components/ui/Card'
import { LayoutGrid, Swords, Trophy } from 'lucide-react'

const PREVIEW_UNITS = [
  { src: '/assets/ui/avatars/avatar-01.png', name: 'Warrior' },
  { src: '/assets/ui/avatars/avatar-02.png', name: 'Archer' },
  { src: '/assets/ui/avatars/avatar-03.png', name: 'Lancer' },
  { src: '/assets/ui/avatars/avatar-04.png', name: 'Pawn' },
  { src: '/assets/ui/avatars/avatar-05.png', name: 'Warrior' },
  { src: '/assets/ui/avatars/avatar-06.png', name: 'Archer' },
  { src: '/assets/ui/avatars/avatar-07.png', name: 'Lancer' },
  { src: '/assets/ui/avatars/avatar-08.png', name: 'Pawn' },
  { src: '/assets/ui/avatars/avatar-09.png', name: 'Warrior' },
  { src: '/assets/ui/avatars/avatar-10.png', name: 'Archer' },
]

export default function Home() {
  return (
    <div className="game-bg game-scroll app-frame-outer">
      <div className="mobile-shell">
        {/* ── Hero ─────────────────────────────────────── */}
        <section className="flex flex-col items-center gap-3 px-4 pt-8 pb-5">
          <div className="relic-frame relative h-24 w-24 overflow-hidden rounded-2xl p-1 anim-glow">
            <Image src="/logo.png" alt="CETAS" fill className="object-contain p-1" priority />
          </div>

          <div className="text-center">
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-[var(--text-2)]">Dark Fantasy Auto Battler</p>
            <h1 className="font-heading mt-1 text-[34px] font-semibold leading-[0.95] tracking-wide text-[var(--gold)]">
              CETAS
            </h1>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
              Build squad. Fight realm. Earn glory.
            </p>
          </div>

          <div className="flex gap-2">
            <Badge>Phase I</Badge>
            <Badge>Mobile Mini App</Badge>
          </div>
        </section>

        {/* ── Preview card ─────────────────────────────── */}
        <section className="px-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-5 gap-0">
                {PREVIEW_UNITS.map((unit) => (
                  <div key={unit.name} className="relative aspect-square border-r border-[var(--border)] last:border-r-0">
                    <Image src={unit.src} alt={unit.name} fill className="object-contain p-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className="flex flex-col gap-3 px-4 pt-4 pb-10">
          <Link href="/game">
            <Button variant="gold" size="lg" className="w-full anim-glow">
              <Swords className="h-4 w-4" /> MULAI BERMAIN
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" disabled><Trophy className="h-3 w-3" /> Leaderboard</Button>
            <Button variant="ghost" size="sm" disabled><LayoutGrid className="h-3 w-3" /> Koleksi</Button>
          </div>
          <p className="text-center text-[11px] text-[var(--text-3)]">
            Celo Tactics — Mini App Edition
          </p>
        </section>
      </div>
    </div>
  )
}
