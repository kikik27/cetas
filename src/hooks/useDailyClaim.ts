'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DailyClaimStatusDTO } from '@/src/lib/api-types'

// ─── Query keys ───────────────────────────────────────────────────────────────
export const dailyClaimKeys = {
  status: (wallet: string) => ['daily-claim', wallet] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchDailyClaimStatus(wallet: string): Promise<DailyClaimStatusDTO> {
  const res = await fetch(`/api/daily-claim?wallet=${encodeURIComponent(wallet)}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch daily claim')
  return json.data
}

async function openDailyChest(wallet: string) {
  const res = await fetch('/api/daily-claim', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ wallet }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to open chest')
  return json.data as {
    date: string; rewardType: string; amount: number; label: string
    claimedAt: string; totalPoints: number
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useDailyClaimStatus(wallet: string | null | undefined) {
  return useQuery({
    queryKey: dailyClaimKeys.status(wallet ?? ''),
    queryFn:  () => fetchDailyClaimStatus(wallet!),
    enabled:  !!wallet,
    staleTime: 60 * 1000,
  })
}

export function useOpenChest(wallet: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => openDailyChest(wallet),
    onSuccess: (data) => {
      // Mark as claimed in cache
      qc.setQueryData<DailyClaimStatusDTO>(dailyClaimKeys.status(wallet), {
        claimed: true,
        reward: {
          date:       data.date,
          rewardType: data.rewardType,
          amount:     data.amount,
          label:      data.label,
          claimedAt:  data.claimedAt,
        },
      })
      // Refresh player points
      qc.invalidateQueries({ queryKey: ['player', wallet] })
    },
  })
}
