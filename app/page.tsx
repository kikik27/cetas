import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { Swords } from 'lucide-react'
import LandingClient from '@/src/ui/LandingClient'

// ── Leaves: tumble and fall across the bottom half ────────────────────────────
const LEAVES = [
  { src: '/assets/fx/leaf/1.png', cls: 'leaf l1', w: 22 },
  { src: '/assets/fx/leaf/3.png', cls: 'leaf l2', w: 18 },
  { src: '/assets/fx/leaf/5.png', cls: 'leaf l3', w: 24 },
  { src: '/assets/fx/leaf/2.png', cls: 'leaf l4', w: 20 },
  { src: '/assets/fx/leaf/4.png', cls: 'leaf l5', w: 16 },
  { src: '/assets/fx/leaf/6.png', cls: 'leaf l6', w: 22 },
  { src: '/assets/fx/leaf/1.png', cls: 'leaf l7', w: 18 },
  { src: '/assets/fx/leaf/3.png', cls: 'leaf l8', w: 20 },
]

export default function Home() {
  return (
    <div className="landing-bg game-scroll app-frame-outer mobile-shell relative overflow-hidden flex flex-col">

      {/* ── Black curtain — covers everything, fades out first ── */}
      <div className="curtain" aria-hidden />

      {/* ── Vignette overlay ── */}
      <div className="landing-overlay" aria-hidden />

      {/* ── Leaves — ambient, always running ── */}
      {LEAVES.map((l, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <div key={`leaf-${i}`} className={l.cls} aria-hidden>
          <img src={l.src} alt="" style={{ width: l.w, height: 'auto' }} />
        </div>
      ))}

      {/* ── Subtitle — fades up after logo lands ── */}
      <section className="relative z-10 flex flex-col items-center gap-2 px-4 pt-10 pb-4">
        <p className="intro-subtitle font-display text-[10px] uppercase tracking-[0.32em] text-[rgba(245,216,120,0.7)]">
          Dark Fantasy Auto Battler
        </p>

        {/* ── Logo — slams down with impact glow ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="CETAS"
          className="intro-logo object-contain"
          style={{ width: 420, height: 'auto' }}
        />

        {/* ── Gold flash burst on logo impact ── */}
        <div className="intro-burst" aria-hidden />
      </section>

      {/* ── CTA — rises last ── */}
      <section className="intro-cta relative z-10 flex flex-col gap-3 px-4 pb-6">
        <Link href="/game">
          <Button variant="pixelGold" size="lg" className="w-full font-black tracking-wider">
            <Swords className="h-5 w-5" />
            PLAY NOW
          </Button>
        </Link>

        <p className="text-center font-display text-[10px] uppercase tracking-[0.2em] text-[rgba(245,216,120,0.5)]">
        Celo Tactics · Mini App Edition
        </p>
      </section>

      {/* ── Splash + music (client-only) ── */}
      <LandingClient />
    </div>
  )
}
