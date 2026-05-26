'use client'

import { useQuery } from '@tanstack/react-query'
import type { LeaderboardEntryDTO } from '@/src/lib/api-types'

export const leaderboardKeys = {
  list: (limit: number) => ['leaderboard', limit] as const,
}

async function fetchLeaderboard(
  limit: number,
): Promise<{ leaderboard: LeaderboardEntryDTO[]; myRank: number | null }> {
  const res = await fetch(
    `/api/leaderboard?limit=${limit}`,
    { credentials: 'include' }
  )
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch leaderboard')
  return json.data
}

export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: leaderboardKeys.list(limit),
    queryFn:  () => fetchLeaderboard(limit),
    staleTime: 60 * 1000,
  })
}
