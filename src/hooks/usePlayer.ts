'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PlayerDTO } from '@/src/lib/api-types'

// ─── Query keys ───────────────────────────────────────────────────────────────
export const playerKeys = {
  all:    ['player'] as const,
  detail: (wallet: string) => ['player', wallet] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchPlayer(wallet: string): Promise<PlayerDTO> {
  const res = await fetch(`/api/player?wallet=${encodeURIComponent(wallet)}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch player')
  return json.data
}

async function updatePlayer(payload: { wallet: string; name?: string; avatarIdx?: number }): Promise<PlayerDTO> {
  const res = await fetch('/api/player', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to update player')
  return json.data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function usePlayer(wallet: string | null | undefined) {
  return useQuery({
    queryKey: playerKeys.detail(wallet ?? ''),
    queryFn:  () => fetchPlayer(wallet!),
    enabled:  !!wallet,
    staleTime: 2 * 60 * 1000,  // 2 minutes
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updatePlayer,
    onSuccess: (data) => {
      qc.setQueryData(playerKeys.detail(data.walletAddress), data)
    },
  })
}
