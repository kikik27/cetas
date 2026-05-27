'use client'

/**
 * useAuth — manages the full auth lifecycle.
 *
 * Flow:
 * 1. On mount: GET /api/auth/me to restore existing session
 * 2. When wallet appears after restore completes:
 *    - session wallet matches → already authenticated, skip
 *    - no session → POST /api/auth/login (challenge + personal_sign)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { LoginResponseDTO, PlayerDTO } from '@/src/lib/api-types'

export type AuthStatus =
  | 'idle'           // initial
  | 'restoring'      // GET /api/auth/me in-flight
  | 'logging-in'     // POST /api/auth/login in-flight
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export interface AuthState {
  status:      AuthStatus
  player:      PlayerDTO | null
  isNewPlayer: boolean
  error:       string | null
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchMe(): Promise<PlayerDTO | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data as PlayerDTO) ?? null
  } catch {
    return null
  }
}

async function login(wallet: string): Promise<LoginResponseDTO> {
  // In dev without window.ethereum, skip SIWE and send wallet-only payload
  type EthProvider = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> }
  const win = typeof window === 'undefined'
    ? undefined
    : (window as unknown as { ethereum?: EthProvider })

  // Poll up to 2 s for MiniPay to inject window.ethereum
  let ethereum = win?.ethereum
  if (!ethereum) {
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 100))
      ethereum = win?.ethereum
      if (ethereum) break
    }
  }

  // Dev bypass: no ethereum provider → skip SIWE
  if (process.env.NODE_ENV === 'development' && !ethereum) {
    const res  = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ wallet }),
    })
    const json = await res.json()
    if (!res.ok || json.error) throw new Error(json.error ?? 'Login failed')
    return json.data as LoginResponseDTO
  }

  if (!ethereum) throw new Error('Wallet provider unavailable — open this app inside MiniPay')

  // Get challenge
  const challengeRes = await fetch('/api/auth/challenge', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'include', body: JSON.stringify({ wallet }),
  })
  const challengeJson = await challengeRes.json()
  if (!challengeRes.ok || challengeJson.error) {
    throw new Error(challengeJson.error ?? 'Failed to create auth challenge')
  }
  const message = challengeJson.data.message as string

  // Sign — MiniPay uses personal_sign with [message, address]
  let signature: unknown
  try {
    signature = await ethereum.request({ method: 'personal_sign', params: [message, wallet] })
  } catch (err) {
    throw new Error(`Signature rejected: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (typeof signature !== 'string') throw new Error('Invalid signature response')

  // Login
  const res  = await fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'include', body: JSON.stringify({ wallet, message, signature }),
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
    status: 'idle', player: null, isNewPlayer: false, error: null,
  })

  // Refs that survive re-renders without causing effect re-runs
  const loginInFlightRef  = useRef(false)   // true while login() is running
  const restoredRef       = useRef(false)   // true after fetchMe() completes
  const restoringRef      = useRef(false)   // true while fetchMe() is running
  const authedWalletRef   = useRef<string | null>(null)
  const [loginTrigger, setLoginTrigger] = useState(0)  // increment to force Step 2 re-run

  // ── Step 1: Restore session on mount ──────────────────────────────────────
  useEffect(() => {
    if (restoringRef.current || restoredRef.current) return
    restoringRef.current = true

    let cancelled = false
    setState(s => ({ ...s, status: 'restoring' }))

    fetchMe().then(player => {
      if (cancelled) return
      restoredRef.current  = true
      restoringRef.current = false

      if (player) {
        authedWalletRef.current = player.walletAddress.toLowerCase()
        setState({ status: 'authenticated', player, isNewPlayer: false, error: null })
        qc.setQueryData(['player', player.walletAddress], player)
        qc.setQueryData(['player', 'me'], player)
      } else {
        setState(s => ({ ...s, status: 'unauthenticated' }))
      }
    })

    return () => {
      cancelled = true
      // Allow re-run after Strict Mode unmount
      restoringRef.current = false
      restoredRef.current  = false
    }
  }, [qc])

  // ── Step 2: Login once restore is done and wallet is available ────────────
  useEffect(() => {
    if (!wallet) return
    if (!restoredRef.current) return          // wait for fetchMe to finish
    if (loginInFlightRef.current) return      // login already running
    if (authedWalletRef.current === wallet) return  // already authed
    loginInFlightRef.current = true
    authedWalletRef.current  = wallet

    let cancelled = false

    const runLogin = async () => {
      setState(s => ({ ...s, status: 'logging-in', error: null }))
      try {
        const data = await login(wallet)
        if (cancelled) return
        setState({
          status: 'authenticated', player: data.player,
          isNewPlayer: data.isNewPlayer, error: null,
        })
        if (data.player) {
          qc.setQueryData(['player', data.player.walletAddress], data.player)
          qc.setQueryData(['player', 'me'], data.player)
        }
      } catch (err) {
        if (cancelled) return
        authedWalletRef.current = null
        setState({ status: 'error', player: null, isNewPlayer: false, error: String(err) })
      } finally {
        loginInFlightRef.current = false
      }
    }

    void runLogin()

    return () => { cancelled = true }
  // wallet is the only real trigger — all other guards use refs
  // loginTrigger forces re-run after retryLogin
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, loginTrigger, qc])

  // ── Retry: reset so Step 2 can re-run ─────────────────────────────────────
  const retryLogin = useCallback(() => {
    if (state.status !== 'error') return
    authedWalletRef.current  = null
    loginInFlightRef.current = false
    setState(s => ({ ...s, status: 'unauthenticated', error: null }))
    setLoginTrigger(n => n + 1)  // force Step 2 effect to re-run
  }, [state.status])

  // ── Sign out ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await logout()
    authedWalletRef.current  = null
    loginInFlightRef.current = false
    qc.clear()
    setState({ status: 'unauthenticated', player: null, isNewPlayer: false, error: null })
  }, [qc])

  // ── Update player after onboarding ────────────────────────────────────────
  const updatePlayer = useCallback((patch: Partial<PlayerDTO>) => {
    setState(s => {
      const updated = s.player ? { ...s.player, ...patch } : asPlayerDTO(patch)
      if (!updated) return s
      qc.setQueryData(['player', updated.walletAddress], updated)
      qc.setQueryData(['player', 'me'], updated)
      return { ...s, player: updated, isNewPlayer: false }
    })
  }, [qc])

  return { ...state, signOut, updatePlayer, retryLogin }
}

function asPlayerDTO(value: Partial<PlayerDTO>): PlayerDTO | null {
  return (
    typeof value.id === 'string' &&
    typeof value.walletAddress === 'string' &&
    typeof value.name === 'string' &&
    typeof value.avatarIdx === 'number' &&
    typeof value.totalPoints === 'number' &&
    typeof value.experience === 'number' &&
    typeof value.level === 'number' &&
    typeof value.endlessStage === 'number' &&
    typeof value.bestStage === 'number' &&
    (value.gameProgress === null || typeof value.gameProgress === 'object') &&
    typeof value.streakDays === 'number' &&
    typeof value.referralCode === 'string' &&
    typeof value.lastLoginAt === 'string' &&
    typeof value.nameChangesLeft === 'number'
  ) ? (value as PlayerDTO) : null
}
