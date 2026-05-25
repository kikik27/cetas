'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useHomeStore, DAILY_TASK_DEFS } from '@/src/lib/homeStore'
import { cn } from '@/src/lib/utils'

export default function QuestPreview() {
  const { taskStates } = useHomeStore()
  const completedCount = taskStates.filter(t => t.done).length
  const allDone = completedCount === DAILY_TASK_DEFS.length

  return (
    <Link
      href="/tasks"
      className="relic-frame group flex items-center gap-2.5 px-3 py-2.5 no-underline
                 transition-all hover:border-[var(--gold-hi)]"
    >
      {/* Icon — task asset */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
                      border border-[rgba(61,186,106,0.35)] bg-[rgba(61,186,106,0.1)]">
        <Image
          src="/assets/ui/task.png"
          alt="Daily quests"
          width={24}
          height={24}
          unoptimized
          className="pixel object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
          Daily Quests
        </p>
        {/* Progress dots */}
        <div className="mt-0.5 flex items-center gap-1">
          {DAILY_TASK_DEFS.map(def => (
            <span
              key={def.id}
              className={cn(
                'h-1 w-1 rounded-full transition-colors',
                taskStates.find(t => t.id === def.id)?.done ? 'bg-[var(--ok)]' : 'bg-[rgba(11,78,162,0.5)]'
              )}
            />
          ))}
          <span className="ml-1 text-[9px] text-[var(--text-3)]">
            {completedCount}/{DAILY_TASK_DEFS.length}
          </span>
        </div>
      </div>

      <span className={cn(
        'flex-shrink-0 text-[9px] font-bold uppercase tracking-wider',
        allDone ? 'text-[var(--ok)]' : 'text-[var(--text-3)] group-hover:text-[var(--gold-mid)]'
      )}>
        {allDone ? 'Done!' : '›'}
      </span>
    </Link>
  )
}
