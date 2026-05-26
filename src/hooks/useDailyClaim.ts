'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DailyClaimStatusDTO } from '@/src/lib/api-types'
import { syncPlayerQuery } from './usePlayer'

export const dailyClaimKeys = {
  status: () => ['daily-claim'] as const,
}

async function fetchDailyClaimStatus(): Promise<DailyClaimStatusDTO> {
  const res = await fetch('/api/daily-claim', { credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch daily claim')
  return json.data
}

async function openDailyChest() {
  const res = await fetch('/api/daily-claim', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        '{}',
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to open chest')
  return json.data as {
    date: string; rewardType: string; amount: number; label: string
    claimedAt: string; totalPoints: number
  }
}

export function useDailyClaimStatus(enabled = true) {
  return useQuery({
    queryKey:  dailyClaimKeys.status(),
    queryFn:   fetchDailyClaimStatus,
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useOpenChest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: openDailyChest,
    onSuccess: async (data) => {
      qc.setQueryData<DailyClaimStatusDTO>(dailyClaimKeys.status(), {
        claimed: true,
        reward: {
          date:       data.date,
          rewardType: data.rewardType as 'xp',
          amount:     data.amount,
          label:      data.label,
          claimedAt:  data.claimedAt,
        },
      })
      await syncPlayerQuery(qc, { totalPoints: data.totalPoints })
    },
  })
}
