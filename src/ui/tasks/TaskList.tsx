'use client'

/**
 * TaskList — legacy component, kept for backward compat.
 * New usage: TasksClient (uses server data via useTasks hook).
 */
import { CheckSquare } from 'lucide-react'
import { useTasks, useClaimTask } from '@/src/hooks/useTasks'
import { useWallet } from '@/src/providers/WalletProvider'
import TaskItem from './TaskItem'

export default function TaskList() {
  const { authStatus } = useWallet()
  const isReady = authStatus === 'authenticated'

  const { data: tasks = [] } = useTasks(isReady)
  const claimMutation        = useClaimTask()

  const completedCount = tasks.filter(t => t.done).length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1 pb-1">
        <CheckSquare className="h-4 w-4 text-[var(--ok)]" />
        <h1 className="font-display text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
          Daily Quests
        </h1>
        <span className="ml-auto font-display text-[11px] text-[var(--ok)]">
          {completedCount}/{tasks.length || '—'}
        </span>
      </div>

      <div className="stat-bar mb-1" style={{ height: 5 }}>
        <div
          className="stat-bar-fill bg-gradient-to-r from-[var(--ok)] to-[#7fffb0]"
          style={{
            width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%',
            borderRadius: 4,
          }}
        />
      </div>

      {tasks.length === 0 ? (
        <div className="relic-frame flex flex-col items-center gap-2 py-8 text-center">
          <CheckSquare className="h-8 w-8 text-[var(--text-dim)]" />
          <p className="font-display text-[12px] text-[var(--text-3)]">No quests yet</p>
          <p className="text-[10px] text-[var(--text-dim)]">Daily quests will appear after setup</p>
        </div>
      ) : (
        tasks.map(task => (
          <TaskItem
            key={task.id}
            def={{
              id:       task.id,
              label:    task.label,
              desc:     task.desc,
              reward:   task.reward,
              total:    task.total,
              iconId:   task.iconId as import('@/src/lib/homeStore').TaskIconId,
            }}
            progress={task.progress}
            done={task.done}
            claimedAt={task.claimedAt}
            onClaim={() => claimMutation.mutate(task.id)}
            claiming={claimMutation.isPending && claimMutation.variables === task.id}
          />
        ))
      )}
    </div>
  )
}
