'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TaskWithProgressDTO } from '@/src/lib/api-types'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Query keys ───────────────────────────────────────────────────────────────
export const taskKeys = {
  all:   ['tasks'] as const,
  today: (wallet: string) => ['tasks', wallet, todayKey()] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchTasks(wallet: string): Promise<TaskWithProgressDTO[]> {
  const res = await fetch(`/api/tasks?wallet=${encodeURIComponent(wallet)}&date=${todayKey()}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch tasks')
  return json.data
}

async function claimTask(payload: { wallet: string; taskId: string }) {
  const res = await fetch('/api/tasks/claim', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to claim task')
  return json.data as { taskId: string; reward: number; totalPoints: number; claimedAt: string }
}

async function incrementTaskProgress(payload: { wallet: string; taskId: string; increment?: number }) {
  const res = await fetch('/api/tasks/progress', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to update progress')
  return json.data as { taskId: string; progress: number; done: boolean }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useTasks(wallet: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.today(wallet ?? ''),
    queryFn:  () => fetchTasks(wallet!),
    enabled:  !!wallet,
    staleTime: 30 * 1000,  // 30 seconds — tasks change frequently
  })
}

export function useClaimTask(wallet: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => claimTask({ wallet, taskId }),
    onSuccess: (data) => {
      // Optimistically update the task list
      qc.setQueryData<TaskWithProgressDTO[]>(
        taskKeys.today(wallet),
        (old) => old?.map(t =>
          t.id === data.taskId
            ? { ...t, done: true, claimedAt: data.claimedAt }
            : t
        )
      )
      // Invalidate player to refresh totalPoints
      qc.invalidateQueries({ queryKey: ['player', wallet] })
    },
  })
}

export function useIncrementTask(wallet: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { taskId: string; increment?: number }) =>
      incrementTaskProgress({ wallet, ...payload }),
    onSuccess: (data) => {
      qc.setQueryData<TaskWithProgressDTO[]>(
        taskKeys.today(wallet),
        (old) => old?.map(t =>
          t.id === data.taskId
            ? { ...t, progress: data.progress, done: data.done }
            : t
        )
      )
    },
  })
}
