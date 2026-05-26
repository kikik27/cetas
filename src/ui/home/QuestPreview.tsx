'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTasks } from '@/src/hooks/useTasks'
import { useWallet } from '@/src/providers/WalletProvider'
import { cn } from '@/src/lib/utils'

export default function QuestPreview() {
  const { authStatus } = useWallet()
  const isReady = authStatus === 'authenticated'

  const { data: tasks = [] } = useTasks(isReady)

  const completedCount = tasks.filter(t => t.done).length
  const hasTasks       = tasks.length > 0
  const total          = hasTasks ? tasks.length : 0
  const allDone        = tasks.length > 0 && completedCount === tasks.length

  return (
    <Link
      href="/tasks"
      className="relic-frame group flex items-center gap-2.5 px-3 py-2.5 no-underline
                 transition-all hover:border-[var(--gold-hi)]"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
                      border border-[rgba(61,186,106,0.35)] bg-[rgba(61,186,106,0.1)]">
        <Image
          src="/assets/ui/task.png"
          alt="Daily quests"
          width={24} height={24}
          unoptimized
          className="pixel object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
          Daily Quests
        </p>
        <div className="mt-0.5 flex items-center gap-1">
          {hasTasks
            ? tasks.map(t => (
                <span
                  key={t.id}
                  className={cn(
                    'h-1 w-1 rounded-full transition-colors',
                    t.done ? 'bg-[var(--ok)]' : 'bg-[rgba(11,78,162,0.5)]'
                  )}
                />
              ))
            : <span className="text-[9px] text-[var(--text-dim)]">No quests yet</span>
          }
          {hasTasks && (
            <span className="ml-1 text-[9px] text-[var(--text-3)]">
              {completedCount}/{total}
            </span>
          )}
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
