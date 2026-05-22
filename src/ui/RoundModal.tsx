'use client'

import { Button } from '@/src/components/ui/Button'
import { Frown, Skull, Trophy } from 'lucide-react'

interface RoundModalProps {
  show: boolean
  title: string
  titleColor: string
  description: string
  buttonLabel: string
  onNext: () => void
}

export default function RoundModal({
  show, title, titleColor, description, buttonLabel, onNext,
}: RoundModalProps) {
  if (!show) return null

  const isWin      = title.includes('Victory')
  const isGameOver = title.includes('Game Over')
  const btnVariant: 'pixelGold' | 'pixelDanger' = isWin ? 'pixelGold' : 'pixelDanger'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="anim-pop w-full max-w-[300px] overflow-hidden rounded-2xl border border-[var(--border-gold)] bg-[rgba(14,10,24,0.98)] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_40px_rgba(200,146,42,0.08)]">

        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: titleColor }} />

        {/* Inner border */}
        <div className="m-[1px] rounded-[14px] border border-[rgba(200,146,42,0.1)]">
          <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">

            {/* Icon */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{
                color: titleColor,
                borderColor: `${titleColor}40`,
                background: `${titleColor}12`,
                boxShadow: `0 0 24px ${titleColor}20`,
              }}
            >
              {isGameOver
                ? <Skull className="h-9 w-9" />
                : isWin
                ? <Trophy className="h-9 w-9" />
                : <Frown className="h-9 w-9" />
              }
            </div>

            {/* Title */}
            <h2
              id="modal-title"
              className="font-display text-[22px] font-bold"
              style={{ color: titleColor, textShadow: `0 0 20px ${titleColor}60` }}
            >
              {title}
            </h2>

            {/* Description */}
            <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
              {description}
            </p>

            {/* Divider */}
            <div className="divider-gold w-full" />

            {/* CTA */}
            <Button
              onClick={onNext}
              variant={btnVariant}
              size="md"
              autoFocus
              className="w-full text-[13px] font-black"
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
