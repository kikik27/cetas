'use client'

import Image from 'next/image'
import { useHomeStore, DAILY_TASK_DEFS } from '@/src/lib/homeStore'
import TaskItem from './tasks/TaskItem'
import BottomNav from './home/BottomNav'

export default function TasksClient() {
  const { taskStates } = useHomeStore()
  const completedCount = taskStates.filter(t => t.done).length

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── Fixed header ── */}
      <div className="flex flex-shrink-0 items-center gap-2 px-1">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl
                        border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)]">
          <Image src="/assets/ui/task.png" alt="" width={18} height={18} loading="eager" unoptimized className="pixel object-contain" aria-hidden />
        </div>
        <h1 className="font-display text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
          Daily Quests
        </h1>
        <span className="ml-auto font-display text-[11px] text-[var(--ok)]">
          {completedCount}/{DAILY_TASK_DEFS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="stat-bar flex-shrink-0" style={{ height: 5 }}>
        <div
          className="stat-bar-fill bg-gradient-to-r from-[var(--ok)] to-[#7fffb0]"
          style={{ width: `${(completedCount / DAILY_TASK_DEFS.length) * 100}%`, borderRadius: 4 }}
        />
      </div>

      {/* ── Scrollable list ── */}
      <div className="game-scroll flex flex-1 flex-col gap-2 overflow-y-auto">
        {DAILY_TASK_DEFS.map(def => (
          <TaskItem key={def.id} def={def} />
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
