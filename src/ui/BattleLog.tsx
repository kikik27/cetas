'use client'

import { useEffect, useRef } from 'react'

export default function BattleLog({ log }: { log: string[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [log])

  return (
    <div
      ref={ref}
      className="surface min-h-[38px] max-h-[58px] overflow-y-auto rounded-xl px-3 py-2 text-[11px] leading-relaxed text-[var(--text-2)]"
      role="log"
      aria-live="polite"
      aria-label="Battle log"
    >
      {log.map((line, i) => (
        <div
          key={i}
          className={i === log.length - 1 ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}
        >
          {line}
        </div>
      ))}
    </div>
  )
}
