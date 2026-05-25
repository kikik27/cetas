import Image from 'next/image'
import LandingClient from '@/src/ui/LandingClient'
import LandingGate from '@/src/ui/LandingGate'

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

export default function RootPage() {
  return (
    <div className="app-frame-outer">
      <div className="mobile-shell landing-bg relative flex flex-col overflow-hidden">

        <div className="curtain" aria-hidden />
        <div className="landing-overlay" aria-hidden />

        {LEAVES.map((l, i) => (
          <div key={`leaf-${i}`} className={l.cls} aria-hidden>
            <Image src={l.src} alt="" loading="lazy" width={l.w} height={20} unoptimized />
          </div>
        ))}

        {/* ── Center block: subtitle + logo + button ── */}
        <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <div className="flex flex-col items-center gap-2">
            <p className="intro-subtitle font-display text-[10px] uppercase tracking-[0.32em] text-[rgba(125,212,248,0.7)]">
              Tactical Auto Battler · Celo L2
            </p>
            <Image
              src="/logo.png"
              alt="CETAS"
              loading="eager"
              width={300}
              height={80}
              className="intro-logo w-full max-w-[300px] object-contain"
            />
            <div className="intro-burst" aria-hidden />
          </div>

          {/* Button sits right below the logo */}
          <div className="w-full max-w-[280px]">
            <LandingGate />
          </div>
        </section>

        {/* ── Bottom tagline only ── */}
        <p className="intro-cta relative z-10 pb-8 text-center font-display text-[10px] uppercase tracking-[0.2em] text-[rgba(245,216,120,0.4)]">
          Celo Tactics · Mini App Edition
        </p>

        <LandingClient />
      </div>
    </div>
  )
}
