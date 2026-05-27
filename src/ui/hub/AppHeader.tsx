import Image from 'next/image'

export default function AppHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
      <Image
        src="/logo.png"
        alt="CETAS"
        width={80}
        height={28}
        className="object-contain"
        style={{ height: 'auto' }}
        priority
      />
      <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-gold)] bg-[rgba(200,146,42,0.08)] px-3 py-1">
        <span className="font-display text-[9px] uppercase tracking-[0.2em] text-[var(--gold-mid)]">
          Celo Tactics
        </span>
      </div>
    </header>
  )
}
