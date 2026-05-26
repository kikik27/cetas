'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TaskWithProgressDTO } from '@/src/lib/api-types'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export const taskKeys = {
  today: () => ['tasks', todayKey()] as const,
}

async function fetchTasks(): Promise<TaskWithProgressDTO[]> {
  const res = await fetch(`/api/tasks?date=${todayKey()}`, { credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch tasks')
  return json.data
}

async function claimTask(taskId: string) {
  const res = await fetch('/api/tasks/claim', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ taskId }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to claim task')
  return json.data as { taskId: string; reward: number; totalPoints: number; claimedAt: string }
}

async function incrementTaskProgress(payload: { taskId: string; increment?: number }) {
  const res = await fetch('/api/tasks/progress', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to update progress')
  return json.data as { taskId: string; progress: number; done: boolean }
}

export function useTasks(enabled = true) {
  return useQuery({
    queryKey:  taskKeys.today(),
    queryFn:   fetchTasks,
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useClaimTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: claimTask,
    onSuccess: (data) => {
      qc.setQueryData<TaskWithProgressDTO[]>(
        taskKeys.today(),
        (old) => old?.map(t =>
          t.id === data.taskId ? { ...t, done: true, claimedAt: data.claimedAt } : t
        )
      )
      qc.invalidateQueries({ queryKey: playerKeys.me })
    },
  })
}

export function useIncrementTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: incrementTaskProgress,
    onSuccess: (data) => {
      qc.setQueryData<TaskWithProgressDTO[]>(
        taskKeys.today(),
        (old) => old?.map(t =>
          t.id === data.taskId ? { ...t, progress: data.progress, done: data.done } : t
        )
      )
    },
  })
}

// Import here to avoid circular dep
import { playerKeys } from './usePlayer'
