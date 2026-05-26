'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FriendDTO } from '@/src/lib/api-types'
import { playerKeys } from './usePlayer'

export const friendKeys = {
  list: () => ['friends'] as const,
}

async function fetchFriends(): Promise<FriendDTO[]> {
  const res = await fetch('/api/friends', { credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch friends')
  return json.data
}

async function claimReferralReward(friendId: string) {
  const res = await fetch('/api/friends/claim', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ friendId }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to claim reward')
  return json.data as { friendId: string; reward: number; totalPoints: number }
}

async function submitReferralCode(code: string) {
  const res = await fetch('/api/friends/referral', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ code }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? json.error)
  return json.data as { accepted: boolean; reward: number; totalPoints: number }
}

export function useFriends(enabled = true) {
  return useQuery({
    queryKey:  friendKeys.list(),
    queryFn:   fetchFriends,
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

export function useClaimReferralReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: claimReferralReward,
    onSuccess: (data) => {
      qc.setQueryData<FriendDTO[]>(friendKeys.list(), (old) =>
        old?.map(f => f.id === data.friendId ? { ...f, rewarded: true } : f)
      )
      qc.invalidateQueries({ queryKey: playerKeys.me })
    },
  })
}

export function useSubmitReferralCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitReferralCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: playerKeys.me })
    },
  })
}
