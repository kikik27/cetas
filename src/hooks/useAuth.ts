'use client'

/**
 * useAuth — manages the full auth lifecycle.
 *
 * Flow:
 * 1. On mount: call GET /api/auth/me to restore existing session
 * 2. When wallet address appears (wagmi auto-connect):
 *    - If session already matches this wallet → done
 *    - Otherwise → POST /api/auth/login to load profile + set cookie
 * 3. Expose player profile, loading state, and isNewPlayer flag
 *    (isNewPlayer = true → caller should show onboarding modal)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { LoginResponseDTO, PlayerDTO } from '@/src/lib/api-types'

export type AuthStatus =
  | 'idle'        // not started
  | 'restoring'   // checking existing session via /api/auth/me
  | 'logging-in'  // calling /api/auth/login with wallet address
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export interface AuthState {
  status:      AuthStatus
  player:      PlayerDTO | null
  isNewPlayer: boolean
  error:       string | null
}

async function fetchMe(): Promise<PlayerDTO | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

async function login(wallet: string): Promise<LoginResponseDTO> {
  const res = await fetch('/api/auth/login', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ wallet }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Login failed')
  return json.data as LoginResponseDTO
}

async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(wallet: string | null) {
  const qc = useQueryClient()

  const [state, setState] = useState<AuthState>({
    status:      'idle',
    player:      null,
    isNewPlayer: false,
    error:       null,
  })

  // Track which wallet we last authenticated to avoid duplicate calls
  const authedWalletRef = useRef<string | null>(null)
  const hasRestoredRef  = useRef(false)

  // ── Step 1: Restore session on mount ──────────────────────────────────────
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    setState(s => ({ ...s, status: 'restoring' }))

    fetchMe().then(player => {
      if (player) {
        authedWalletRef.current = player.walletAddress
        setState({ status: 'authenticated', player, isNewPlayer: false, error: null })
        // Seed TanStack Query cache so usePlayer() hooks work immediately
        qc.setQueryData(['player', player.walletAddress], player)
        qc.setQueryData(['player', 'me'], player)
      } else {
        setState(s => ({ ...s, status: 'unauthenticated' }))
      }
    })
  }, [qc])

  // ── Step 2: Login when wallet address becomes available ───────────────────
  useEffect(() => {
    if (!wallet) return
    // Already authenticated with this wallet
    if (authedWalletRef.current === wallet) return
    // Still restoring — wait for it to finish
    if (state.status === 'restoring') return

    authedWalletRef.current = wallet

    const runLogin = async () => {
      setState(s => ({ ...s, status: 'logging-in', error: null }))
      try {
        const data = await login(wallet)
        setState({
          status:      'authenticated',
          player:      data.player,
          isNewPlayer: data.isNewPlayer,
          error:       null,
        })
        if (data.player) {
          qc.setQueryData(['player', data.player.walletAddress], data.player)
          qc.setQueryData(['player', 'me'], data.player)
        }
      } catch (err) {
        authedWalletRef.current = null
        setState({ status: 'error', player: null, isNewPlayer: false, error: String(err) })
      }
    }

    void runLogin()
  }, [wallet, state.status, qc])

  // ── Logout ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await logout()
    authedWalletRef.current = null
    qc.clear()
    setState({ status: 'unauthenticated', player: null, isNewPlayer: false, error: null })
  }, [qc])

  // ── Update player in local state (after onboarding save) ──────────────────
  const updatePlayer = useCallback((patch: Partial<PlayerDTO>) => {
    setState(s => {
      const updated = s.player ? { ...s.player, ...patch } : asPlayerDTO(patch)
      if (!updated) return s
      qc.setQueryData(['player', updated.walletAddress], updated)
      qc.setQueryData(['player', 'me'], updated)
      return { ...s, player: updated, isNewPlayer: false }
    })
  }, [qc])

  return { ...state, signOut, updatePlayer }
}

function asPlayerDTO(value: Partial<PlayerDTO>): PlayerDTO | null {
  return typeof value.id === 'string' &&
    typeof value.walletAddress === 'string' &&
    typeof value.name === 'string' &&
    typeof value.avatarIdx === 'number' &&
    typeof value.totalPoints === 'number' &&
    typeof value.level === 'number' &&
    typeof value.streakDays === 'number' &&
    typeof value.referralCode === 'string' &&
    typeof value.lastLoginAt === 'string' &&
    typeof value.nameChangesLeft === 'number'
    ? value as PlayerDTO
    : null
}
