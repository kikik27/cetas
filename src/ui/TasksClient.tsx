'use client'

import Image from 'next/image'
import { useTasks, useClaimTask } from '@/src/hooks/useTasks'
import { useWallet } from '@/src/providers/WalletProvider'
import TaskItem from './tasks/TaskItem'
import BottomNav from './home/BottomNav'

export default function TasksClient() {
  const { authStatus } = useWallet()
  const isReady = authStatus === 'authenticated'

  const { data: tasks = [], isLoading } = useTasks(isReady)
  const claimMutation = useClaimTask()

  const completedCount = tasks.filter(t => t.done).length

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── Fixed header ── */}
      <div className="flex flex-shrink-0 items-center gap-2 px-1">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl
                        border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)]">
          <Image
            src="/assets/ui/task.png"
            alt=""
            width={18} height={18}
            loading="eager"
            unoptimized
            className="pixel object-contain"
            aria-hidden
          />
        </div>
        <h1 className="font-display text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
          Daily Quests
        </h1>
        <span className="ml-auto font-display text-[11px] text-[var(--ok)]">
          {completedCount}/{tasks.length || '—'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="stat-bar flex-shrink-0" style={{ height: 5 }}>
        <div
          className="stat-bar-fill bg-gradient-to-r from-[var(--ok)] to-[#7fffb0]"
          style={{
            width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%',
            borderRadius: 4,
          }}
        />
      </div>

      {/* ── Scrollable list ── */}
      <div className="game-scroll flex flex-1 flex-col gap-2 overflow-y-auto">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relic-frame h-[60px] animate-pulse rounded-xl bg-[rgba(11,78,162,0.1)]"
              />
            ))
          : tasks.map(task => (
              <TaskItem
                key={task.id}
                def={{
                  id:      task.id,
                  label:   task.label,
                  desc:    task.desc,
                  reward:  task.reward,
                  total:   task.total,
                  iconId:  task.iconId as import('@/src/lib/homeStore').TaskIconId,
                }}
                progress={task.progress}
                done={task.done}
                claimedAt={task.claimedAt}
                onClaim={() => claimMutation.mutate(task.id)}
                claiming={claimMutation.isPending && claimMutation.variables === task.id}
              />
            ))
        }
      </div>

      <BottomNav />
    </div>
  )
}
