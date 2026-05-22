'use client'

import { useEffect, useRef } from 'react'

export default function BattleLog({ log }: { log: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [log])

  return (
    <div
      ref={ref}
      className="rounded-xl px-3 py-2 text-[11px] leading-relaxed min-h-[36px] max-h-[56px] overflow-y-auto scroll-x"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'var(--text-2)',
      }}
      role="log" aria-live="polite" aria-label="Log pertempuran"
    >
      {log.map((line, i) => <div key={i} className="py-[1px]">{line}</div>)}
    </div>
  )
}
