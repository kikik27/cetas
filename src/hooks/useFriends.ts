'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FriendDTO } from '@/src/lib/api-types'

// ─── Query keys ───────────────────────────────────────────────────────────────
export const friendKeys = {
  list: (wallet: string) => ['friends', wallet] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchFriends(wallet: string): Promise<FriendDTO[]> {
  const res = await fetch(`/api/friends?wallet=${encodeURIComponent(wallet)}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch friends')
  return json.data
}

async function claimReferralReward(payload: { wallet: string; friendId: string }) {
  const res = await fetch('/api/friends/claim', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to claim reward')
  return json.data as { friendId: string; reward: number; totalPoints: number }
}

async function submitReferralCode(payload: { wallet: string; code: string }) {
  const res = await fetch('/api/friends/referral', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? json.error)
  return json.data as { accepted: boolean; reward: number; totalPoints: number }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useFriends(wallet: string | null | undefined) {
  return useQuery({
    queryKey: friendKeys.list(wallet ?? ''),
    queryFn:  () => fetchFriends(wallet!),
    enabled:  !!wallet,
    staleTime: 2 * 60 * 1000,
  })
}

export function useClaimReferralReward(wallet: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (friendId: string) => claimReferralReward({ wallet, friendId }),
    onSuccess: (data) => {
      // Optimistically mark friend as rewarded
      qc.setQueryData<FriendDTO[]>(friendKeys.list(wallet), (old) =>
        old?.map(f => f.id === data.friendId ? { ...f, rewarded: true } : f)
      )
      qc.invalidateQueries({ queryKey: ['player', wallet] })
    },
  })
}

export function useSubmitReferralCode(wallet: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => submitReferralCode({ wallet, code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', wallet] })
    },
  })
}
