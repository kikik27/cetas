'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface LoadingStateProps {
  label?: string
  className?: string
  compact?: boolean
}

export function LoadingState({
  label = 'Loading data',
  className,
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'relic-frame flex flex-col items-center justify-center gap-3 text-center',
        compact ? 'min-h-[96px] px-3 py-4' : 'min-h-[180px] px-4 py-7',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(200,146,42,0.28)] bg-[rgba(200,146,42,0.08)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--gold-hi)]" />
      </div>
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-3)]">
        {label}
      </p>
    </div>
  )
}

interface LoadingRowsProps {
  count?: number
  className?: string
  rowClassName?: string
}

export function LoadingRows({
  count = 6,
  className,
  rowClassName,
}: LoadingRowsProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'relic-frame h-[60px] animate-pulse rounded-xl bg-[rgba(11,78,162,0.1)]',
            rowClassName
          )}
        />
      ))}
    </div>
  )
}
