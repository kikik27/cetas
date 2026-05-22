import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { Card, CardContent } from '@/src/components/ui/Card'
import { LayoutGrid, Swords, Trophy } from 'lucide-react'

// const PREVIEW_UNITS = [
//   { src: '/assets/ui/avatars/avatar-01.png', name: 'Warrior' },
//   { src: '/assets/ui/avatars/avatar-02.png', name: 'Archer' },
//   { src: '/assets/ui/avatars/avatar-03.png', name: 'Lancer' },
//   { src: '/assets/ui/avatars/avatar-04.png', name: 'Pawn' },
// ]

const FX_PARTICLES = [
  { src: '/assets/ui/icons/icon-01.png', cls: 'particle p1' },
  { src: '/assets/ui/icons/icon-02.png', cls: 'particle p2' },
  { src: '/assets/ui/icons/icon-04.png', cls: 'particle p3' },
  { src: '/assets/ui/icons/icon-05.png', cls: 'particle p4' },
  { src: '/assets/ui/icons/icon-06.png', cls: 'particle p5' },
  { src: '/assets/ui/icons/icon-07.png', cls: 'particle p6' },
  { src: '/assets/ui/icons/icon-08.png', cls: 'particle p7' },
  { src: '/assets/ui/icons/icon-09.png', cls: 'particle p8' },
  { src: '/assets/ui/icons/icon-10.png', cls: 'particle p9' },
  { src: '/assets/ui/icons/icon-11.png', cls: 'particle p10' },
  { src: '/assets/ui/icons/icon-12.png', cls: 'particle p11' },
]

export default function Home() {
  return (
    <div className="landing-bg game-scroll app-frame-outer mobile-shell relative overflow-hidden flex">

      {FX_PARTICLES.map((p, i) => (
        <Image key={i} src={p.src} alt="" width={18} height={18} className={p.cls} aria-hidden />
      ))}

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center gap-3 px-4 pt-9 pb-5">
        <div className="text-center">
          <p className="font-display text-[10px] uppercase tracking-[0.28em] text-[#f2ebdb]">Dark Fantasy Auto Battler</p>
          <Image src="/logo.png" alt="CETAS" fill className="object-contain p-1" priority />

          <p className="mt-1 text-[12px] leading-relaxed text-[#f0e8d8]">
            Build squad. Fight realm. Earn glory.
          </p>
        </div>

        <div className="flex gap-2">
          <Badge>Phase I</Badge>
          <Badge>Mobile Mini App</Badge>
        </div>
      </section>

      {/* ── Preview card ─────────────────────────────── */}
      {/* <section className="relative z-10 px-4">
        <Card className="relic-frame overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-4 gap-0">
              {PREVIEW_UNITS.map((unit) => (
                <div key={unit.name} className="relative aspect-square border-r border-[var(--border)] last:border-r-0">
                  <Image src={unit.src} alt={unit.name} fill className="object-contain p-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section> */}

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col gap-3 px-4">
        <Link href="/game">
          <Button variant="gold" size="lg" className="w-full anim-glow">
            <Swords className="h-4 w-4" /> MULAI BERMAIN
          </Button>
        </Link>
        <p className="text-center font-black text-sm text-primary">
          Celo Tactics — Mini App Edition
        </p>
      </section>
    </div>
  )
}
