import Link from 'next/link'
import Image from 'next/image'

const HEROES = [
  { n: '03', size: 56, delay: '0s',   mb: 6 },
  { n: '07', size: 68, delay: '0.3s', mb: 0 },
  { n: '12', size: 68, delay: '0.6s', mb: 0 },
  { n: '18', size: 56, delay: '0.9s', mb: 6 },
]

export default function Home() {
  return (
    <div
      className="home-bg min-h-dvh flex flex-col items-center justify-between select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 32px)',
        paddingLeft: 20, paddingRight: 20,
      }}
    >
      {/* ── Network pill ── */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{ background: 'rgba(212,170,80,0.08)', border: '1px solid rgba(212,170,80,0.22)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 anim-pulse" />
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--gold)' }}>
          Celo L2 · MiniPay
        </span>
      </div>

      {/* ── Hero ── */}
      <div className="flex flex-col items-center gap-5 text-center w-full max-w-[360px]">

        {/* Title */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ color: 'var(--gold-lo)' }}>
            Auto-Battler · Roguelike
          </p>
          <h1
            className="text-[52px] font-black tracking-tight leading-[0.9] mt-1"
            style={{
              background: 'linear-gradient(180deg, var(--gold-hi) 0%, var(--gold) 60%, var(--gold-lo) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(212,170,80,0.3))',
            }}
          >
            CELO<br />TACTICS
          </h1>
        </div>

        {/* Characters */}
        <div className="flex items-end justify-center gap-2.5">
          {HEROES.map(h => (
            <div
              key={h.n}
              className="rounded-xl overflow-hidden pixel anim-float"
              style={{
                width: h.size, height: h.size,
                marginBottom: h.mb,
                animationDelay: h.delay,
                border: '1.5px solid rgba(212,170,80,0.28)',
                background: 'rgba(255,255,255,0.03)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
              }}
            >
              <Image
                src={`/assets/ui/avatars/avatar-${h.n}.png`}
                alt="" width={256} height={256}
                className="pixel w-full h-full object-cover"
                aria-hidden priority
              />
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-[13px] leading-relaxed max-w-[260px]" style={{ color: 'var(--text-2)' }}>
          Susun pasukan, lawan musuh, menangkan arena.<br />
          <span style={{ color: 'var(--gold-lo)' }}>Fully on-chain · Gasless via Biconomy</span>
        </p>

        {/* Stats */}
        <div className="flex gap-6 justify-center">
          {[['5', 'Ronde'], ['4', 'Unit'], ['1.4K', 'TPS']].map(([v, l]) => (
            <div key={l} className="flex flex-col items-center gap-0.5">
              <span className="text-[22px] font-black" style={{ color: 'var(--gold-hi)' }}>{v}</span>
              <span className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'var(--text-3)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="flex flex-col items-center gap-3 w-full max-w-[300px]">
        <Link
          href="/game"
          className="btn btn-gold w-full h-14 text-[16px] rounded-2xl anim-glow"
          style={{ fontSize: 16 }}
        >
          ⚔️ &nbsp;MULAI BERMAIN
        </Link>
        <div className="flex gap-2 w-full">
          <button className="btn btn-ghost flex-1 h-10 text-[11px] rounded-xl" disabled>🏆 Leaderboard</button>
          <button className="btn btn-ghost flex-1 h-10 text-[11px] rounded-xl" disabled>🎴 Koleksi</button>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Segera hadir di MiniPay</p>
      </div>
    </div>
  )
}
