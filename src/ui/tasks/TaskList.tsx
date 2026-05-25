'use client'

import { CheckSquare, Trophy } from 'lucide-react'
import { useHomeStore, DAILY_TASK_DEFS } from '@/src/lib/homeStore'
import TaskItem from './TaskItem'

export default function TaskList() {
  const { taskStates } = useHomeStore()
  const completedCount = taskStates.filter(t => t.done).length
  const totalReward = DAILY_TASK_DEFS.reduce((s, d) => s + d.reward, 0)
  const earnedReward = DAILY_TASK_DEFS
    .filter(d => taskStates.find(t => t.id === d.id)?.done)
    .reduce((s, d) => s + d.reward, 0)
  const allDone = completedCount === DAILY_TASK_DEFS.length

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center
                        rounded-xl border border-[rgba(61,186,106,0.3)] bg-[rgba(61,186,106,0.08)]">
          <CheckSquare className="h-5 w-5 text-[var(--ok)]" />
        </div>
        <div>
          <h1 className="font-display text-[15px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
            Daily Quests
          </h1>
          <p className="text-[10px] text-[var(--text-3)]">Resets at midnight</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-[13px] font-bold text-[var(--gold-hi)]">
            {earnedReward.toLocaleString()}
            <span className="text-[10px] text-[var(--text-3)]">/{totalReward}</span>
          </p>
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">pts earned</p>
        </div>
      </div>

      {/* Progress summary */}
      <div className="relic-frame flex items-center gap-3 px-4 py-3">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">Progress</span>
            <span className="font-display text-[11px] font-bold text-[var(--ok)]">
              {completedCount}/{DAILY_TASK_DEFS.length}
            </span>
          </div>
          <div className="stat-bar" style={{ height: 8, borderRadius: 4 }}>
            <div
              className="stat-bar-fill bg-gradient-to-r from-[var(--ok)] to-[#7fffb0]"
              style={{ width: `${(completedCount / DAILY_TASK_DEFS.length) * 100}%`, borderRadius: 4 }}
            />
          </div>
        </div>
        {allDone && (
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-lg
                          border border-[rgba(200,146,42,0.4)] bg-[rgba(200,146,42,0.1)]
                          px-2.5 py-1.5">
            <Trophy className="h-4 w-4 text-[var(--gold-hi)]" />
            <span className="font-display text-[9px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
              All done!
            </span>
          </div>
        )}
      </div>

      {/* Task items */}
      {DAILY_TASK_DEFS.map(def => (
        <TaskItem key={def.id} def={def} />
      ))}
    </div>
  )
}
