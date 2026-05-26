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
      className="surface h-full min-h-0 overflow-y-auto rounded-xl px-2.5 py-1.5 text-[10px] leading-snug text-[var(--text-2)]"
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
