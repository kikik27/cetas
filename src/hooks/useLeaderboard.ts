'use client'

import { useQuery } from '@tanstack/react-query'
import type { LeaderboardEntryDTO } from '@/src/lib/api-types'

// ─── Query keys ───────────────────────────────────────────────────────────────
export const leaderboardKeys = {
  list: (limit: number, wallet?: string) => ['leaderboard', limit, wallet ?? ''] as const,
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────
async function fetchLeaderboard(
  limit: number,
  wallet?: string,
): Promise<{ leaderboard: LeaderboardEntryDTO[]; myRank: number | null }> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (wallet) params.set('wallet', wallet)

  const res = await fetch(`/api/leaderboard?${params}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch leaderboard')
  return json.data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLeaderboard(wallet?: string, limit = 50) {
  return useQuery({
    queryKey: leaderboardKeys.list(limit, wallet),
    queryFn:  () => fetchLeaderboard(limit, wallet),
    staleTime: 60 * 1000,  // 1 minute — leaderboard doesn't need to be real-time
  })
}
