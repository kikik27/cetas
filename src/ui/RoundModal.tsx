'use client'

interface RoundModalProps {
  show: boolean; title: string; titleColor: string
  description: string; buttonLabel: string; onNext: () => void
}

export default function RoundModal({ show, title, titleColor, description, buttonLabel, onNext }: RoundModalProps) {
  if (!show) return null

  const isWin = title.includes('Menang')
  const isGameOver = title.includes('Game Over')
  const emoji = isGameOver ? '☠️' : isWin ? '🏆' : '😤'
  const btnClass = isWin ? 'btn-gold' : 'btn-red'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(4,3,10,0.85)', backdropFilter: 'blur(6px)' }}
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div
        className="anim-pop w-full max-w-[300px] rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid rgba(212,170,80,0.28)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: titleColor }} />

        <div className="px-6 py-6 flex flex-col items-center gap-3 text-center">
          <div className="text-[52px] leading-none">{emoji}</div>

          <h2 id="modal-title" className="text-[20px] font-black" style={{ color: titleColor }}>
            {title.replace(/^[^\s]+\s/, '')}
          </h2>

          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {description}
          </p>

          <div className="w-full h-px" style={{ background: 'var(--border)' }} />

          <button
            onClick={onNext}
            autoFocus
            className={`btn ${btnClass} w-full h-12 rounded-xl text-[13px] font-black`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
