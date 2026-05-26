'use client'

import { Button } from '@/src/components/ui/Button'
import { Coins, Swords, Timer, Dices, Zap } from 'lucide-react'
import { BATTLE_LIMIT_MS, REROLL_COST, SPEED_UP_FACTOR } from '@/src/game/constants'

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

const BATTLE_SECONDS = BATTLE_LIMIT_MS / 1000

export default function Controls({
  phase, hasSelected, secondsLeft, speedUp, onReroll, onSell, onBattle,
}: ControlsProps) {

  /* ── Prep phase ── */
  if (phase !== 'battle') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Reroll */}
          <Button
            onClick={onReroll}
            variant="pixelBlue"
            size="md"
            className="flex-1 text-[12px]"
          >
            <Dices className="h-4 w-4" />
            Reroll
            <span className="ml-0.5 text-[10px] opacity-60">−{REROLL_COST}g</span>
          </Button>

          {/* Sell — only when unit selected */}
          {hasSelected && (
            <Button
              onClick={onSell}
              variant="pixelDanger"
              size="md"
              className="w-12 px-0"
              aria-label="Sell selected unit"
            >
              <Coins className="h-4 w-4" />
            </Button>
          )}

          {/* Battle */}
          <Button
            onClick={onBattle}
            variant="pixelGold"
            size="md"
            className="flex-1 text-[13px] font-black"
          >
            <Swords className="h-4 w-4" />
            BATTLE!
          </Button>
        </div>

        <p className="text-center text-[10px] text-[var(--text-3)]">
          Tap unit → tap tile to place · Tap selected unit to sell
        </p>
      </div>
    )
  }

  /* ── Battle phase ── */
  const pct      = speedUp ? 100 : (secondsLeft / BATTLE_SECONDS) * 100
  const barColor = speedUp
    ? 'var(--enemy)'
    : secondsLeft <= 5
    ? 'var(--enemy)'
    : secondsLeft <= 10
    ? 'var(--warn)'
    : 'var(--ok)'
  const timeLabel = speedUp ? `${SPEED_UP_FACTOR}×` : `${secondsLeft}s`

  return (
    <div className="relic-frame flex items-center gap-3 rounded-xl px-3 py-2.5">
      {/* Icon */}
      <Timer className="h-4 w-4 flex-shrink-0 text-[var(--text-3)]" />

      {/* Time label */}
      <span
        className="w-[44px] flex-shrink-0 font-mono text-[16px] font-black tabular-nums"
        style={{ color: barColor, textShadow: `0 0 8px ${barColor}` }}
      >
        {timeLabel}
      </span>

      {/* Progress bar */}
      <div className="h-3 flex-1 overflow-hidden rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)]">
        {speedUp ? (
          <div
            className="h-full w-full"
            style={{
              background: 'repeating-linear-gradient(45deg, var(--enemy) 0px, var(--enemy) 6px, rgba(255,80,80,0.5) 6px, rgba(255,80,80,0.5) 12px)',
              animation: 'stripe 0.4s linear infinite',
              backgroundSize: '32px 100%',
            }}
          />
        ) : (
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: barColor,
              boxShadow: `0 0 8px ${barColor}`,
            }}
          />
        )}
      </div>

      {/* Status label */}
      <span className="flex-shrink-0 text-[10px] font-semibold text-[var(--text-3)]">
        {speedUp ? <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[var(--enemy)]" />Speed up!</span> : 'In progress…'}
      </span>
    </div>
  )
}
