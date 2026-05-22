import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { Card, CardContent } from '@/src/components/ui/Card'
import { LayoutGrid, Swords, Trophy } from 'lucide-react'

const HEROES = ['03', '07', '12', '18']

export default function Home() {
  return (
    <main className="home-bg min-h-dvh select-none px-5 pb-8 pt-6 [padding-top:max(env(safe-area-inset-top),24px)] [padding-bottom:max(env(safe-area-inset-bottom),32px)]">
      <div className="mx-auto flex w-full max-w-[360px] flex-col items-center justify-between gap-6">
        <Badge className="border-[rgba(212,170,80,0.22)] bg-[rgba(212,170,80,0.08)] text-[var(--gold)]">
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-[var(--ok)] anim-pulse" />
          CELO L2 · MINIPAY
        </Badge>

        <Card className="w-full border-[var(--border-gold)] bg-[rgba(18,16,28,0.68)]">
          <CardContent className="flex flex-col items-center gap-4 p-5 text-center">
            <Image
              src="/logo.png"
              alt="CETAS logo"
              width={320}
              height={180}
              className="pixel h-auto w-full max-w-[290px]"
              priority
            />

            <p className="text-[12px] font-semibold tracking-[0.25em] text-[var(--gold-lo)] uppercase">
              Auto-Battler · Roguelike
            </p>

            <div className="flex items-end justify-center gap-2.5">
              {HEROES.map((n, idx) => (
                <div
                  key={n}
                  className="anim-float overflow-hidden rounded-xl border border-[rgba(212,170,80,0.28)] bg-white/3 shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  <Image
                    src={`/assets/ui/avatars/avatar-${n}.png`}
                    alt=""
                    width={64}
                    height={64}
                    className="pixel h-14 w-14 object-cover md:h-16 md:w-16"
                    aria-hidden
                  />
                </div>
              ))}
            </div>

            <p className="max-w-[260px] text-[13px] leading-relaxed text-[var(--text-2)]">
              Susun pasukan. Menangin ronde. Uji mekanik game dulu sebelum on-chain.
            </p>
          </CardContent>
        </Card>

        <div className="grid w-full grid-cols-3 gap-3">
          {[
            ['5', 'Ronde'],
            ['4', 'Unit'],
            ['Phase 1', 'Web2'],
          ].map(([v, l]) => (
            <Card key={l} className="bg-[rgba(255,255,255,0.03)] text-center">
              <CardContent className="p-3">
                <div className="text-[18px] font-black text-[var(--gold-hi)]">{v}</div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--text-3)]">{l}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link href="/game">
            <Button variant="gold" size="lg" className="w-full anim-glow">
              <Swords className="h-4 w-4" /> MULAI BERMAIN
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" disabled><Trophy className="h-3 w-3" /> Leaderboard</Button>
            <Button variant="ghost" size="sm" disabled><LayoutGrid className="h-3 w-3" /> Koleksi</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
