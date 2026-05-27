'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PointRedemptionDTO, RedeemSummaryDTO } from '@/src/lib/api-types'
import { syncPlayerQuery } from './usePlayer'

export const redeemKeys = {
  summary: () => ['redeem'] as const,
}

async function fetchRedeemSummary(): Promise<RedeemSummaryDTO> {
  const res = await fetch('/api/redeem', { credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to fetch redeem data')
  return json.data
}

async function redeemPoints(points: number) {
  const res = await fetch('/api/redeem', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ points }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to redeem points')
  return json.data as {
    totalPoints: number
    redemption: PointRedemptionDTO
    mock: boolean
    rateLabel: string
  }
}

export function useRedeemSummary(enabled = true) {
  return useQuery({
    queryKey:  redeemKeys.summary(),
    queryFn:   fetchRedeemSummary,
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useRedeemPoints() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: redeemPoints,
    onSuccess: async (data) => {
      qc.setQueryData<RedeemSummaryDTO>(redeemKeys.summary(), (old) =>
        old ? {
          ...old,
          totalPoints: data.totalPoints,
          maxPoints:   data.totalPoints,
          history:     [data.redemption, ...old.history].slice(0, 10),
        } : old
      )
      await syncPlayerQuery(qc, { totalPoints: data.totalPoints })
    },
  })
}
