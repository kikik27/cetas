'use client'

interface ControlsProps {
  phase: 'prep' | 'battle'
  hasSelected: boolean
  battleRunning: boolean
  secondsLeft: number
  speedUp: boolean
  onReroll: () => void
  onSell: () => void
  onBattle: () => void
}

export default function Controls({
  phase, hasSelected, secondsLeft, speedUp, onReroll, onSell, onBattle,
}: ControlsProps) {
  if (phase !== 'battle') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button onClick={onReroll} className="btn btn-blue flex-1 h-12 rounded-xl text-[12px]">
            🎲 Reroll <span style={{ opacity: 0.65, fontSize: 10 }}>−2🪙</span>
          </button>
          {hasSelected && (
            <button onClick={onSell} className="btn btn-sm-red w-12 h-12 rounded-xl text-[14px]" aria-label="Jual unit">
              💰
            </button>
          )}
          <button onClick={onBattle} className="btn btn-red flex-1 h-12 rounded-xl text-[13px] font-black">
            ⚔️ BATTLE
          </button>
        </div>
        <p className="text-center text-[10px]" style={{ color: 'var(--text-3)' }}>
          Tap unit → tap tile untuk menempatkan
        </p>
      </div>
    )
  }

  // Battle timer
  const pct = speedUp ? 100 : (secondsLeft / 30) * 100
  const barColor = speedUp ? '#f97316'
    : secondsLeft <= 5 ? '#ef4444'
    : secondsLeft <= 10 ? '#facc15'
    : '#4ade80'
  const timeLabel = speedUp ? '⚡ 3×' : `${secondsLeft}s`
  const timeLabelColor = speedUp ? '#f97316'
    : secondsLeft <= 5 ? '#ef4444'
    : secondsLeft <= 10 ? '#facc15'
    : '#4ade80'

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
    >
      <span className="text-[15px] flex-shrink-0">⏱</span>
      <span
        className="font-mono font-black text-[16px] tabular-nums w-[52px] flex-shrink-0"
        style={{ color: timeLabelColor }}
      >
        {timeLabel}
      </span>
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {speedUp ? (
          <div
            className="h-full w-full"
            style={{
              background: '#f97316',
              backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.22) 4px,rgba(255,255,255,0.22) 8px)',
              animation: 'stripe 0.4s linear infinite',
            }}
          />
        ) : (
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: barColor }}
          />
        )}
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>
        {speedUp ? 'Speed up!' : 'Berlangsung…'}
      </span>
    </div>
  )
}
