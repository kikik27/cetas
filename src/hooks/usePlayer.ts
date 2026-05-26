'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PlayerDTO } from '@/src/lib/api-types'

export const playerKeys = {
  me: ['player', 'me'] as const,
}

async function fetchPlayer(): Promise<PlayerDTO> {
  const res = await fetch('/api/player', { credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch player')
  return json.data
}

async function updatePlayer(payload: { name?: string; avatarIdx?: number }): Promise<PlayerDTO> {
  const res = await fetch('/api/player', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to update player')
  return json.data
}

/** Fetch current player profile. enabled=false until session is ready. */
export function usePlayer(enabled = true) {
  return useQuery({
    queryKey:  playerKeys.me,
    queryFn:   fetchPlayer,
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updatePlayer,
    onSuccess: (data) => {
      qc.setQueryData(playerKeys.me, data)
    },
  })
}
