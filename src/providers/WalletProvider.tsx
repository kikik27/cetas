'use client'

/**
 * WalletProvider — MiniPay wallet + auth session context.
 *
 * Combines:
 * - wagmi auto-connect (MiniPay injects window.ethereum)
 * - useAuth: restore session on mount → login when address appears
 * - Exposes player profile, auth status, and onboarding flag
 *
 * Auto-connect on page load. The server session is issued only after the
 * connected wallet signs a short auth challenge.
 */

import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import { useAccount } from 'wagmi'
import { useAutoConnect } from '@/src/hooks/useAutoConnect'
import { useAuth, type AuthStatus } from '@/src/hooks/useAuth'
import { isMiniPayEnvironment } from '@/src/lib/wagmi'
import type { PlayerDTO } from '@/src/lib/api-types'

// ─── Context shape ────────────────────────────────────────────────────────────

interface WalletContextValue {
  /** Connected wallet address (lowercase), or null */
  wallet:      string | null
  /** True when wagmi + session are both ready */
  connected:   boolean
  /** True while auto-connecting or logging in */
  connecting:  boolean
  /** True when running inside MiniPay */
  isMiniPay:   boolean
  /** Auth lifecycle status */
  authStatus:  AuthStatus
  /** Loaded player profile (null until authenticated) */
  player:      PlayerDTO | null
  /** True on first-ever login — caller should show onboarding */
  isNewPlayer: boolean
  /** Update player in context after onboarding save */
  updatePlayer: (patch: Partial<PlayerDTO>) => void
  /** Clear session + disconnect */
  signOut:     () => Promise<void>
  /** Retry login after an error */
  retryLogin:  () => void
}

const WalletContext = createContext<WalletContextValue>({
  wallet:       null,
  connected:    false,
  connecting:   true,
  isMiniPay:    false,
  authStatus:   'idle',
  player:       null,
  isNewPlayer:  false,
  updatePlayer: () => {},
  signOut:      async () => {},
  retryLogin:   () => {},
})

// ─── Inner bridge — must live inside WagmiProvider ───────────────────────────

function WalletContextBridge({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount()
  const { error: connectError, isPending }     = useAutoConnect()
  const isMiniPay = useSyncExternalStore(
    () => () => {},
    isMiniPayEnvironment,
    () => false,
  )

  // Dev fallback: stable mock address persisted in localStorage
  const [devWallet] = useState<string | null>(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return null
    const stored = localStorage.getItem('cetas_dev_wallet')
    if (stored) return stored
    const mock = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    localStorage.setItem('cetas_dev_wallet', mock)
    return mock
  })

  const effectiveWallet    = address?.toLowerCase() ?? devWallet ?? null
  const effectiveConnected = isConnected || (process.env.NODE_ENV === 'development' && !!devWallet)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { status: authStatus, player, isNewPlayer, updatePlayer, signOut, retryLogin } =
    useAuth(effectiveWallet)

  // connecting = true while wagmi is connecting OR auth is in any loading state
  const connecting =
    isConnecting ||
    isPending ||
    authStatus === 'idle' ||
    authStatus === 'restoring' ||
    authStatus === 'logging-in'

  if (connectError) {
    const msg = connectError.message ?? ''
    if (!msg.includes('AlreadyConnected') && !msg.includes('already connected')) {
      console.warn('[WalletProvider] connect error:', connectError)
    }
  }

  return (
    <WalletContext.Provider value={{
      wallet:      effectiveWallet,
      connected:   effectiveConnected,
      connecting,
      isMiniPay,
      authStatus,
      player,
      isNewPlayer,
      updatePlayer,
      signOut,
      retryLogin,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

// ─── Public exports ───────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <WalletContextBridge>{children}</WalletContextBridge>
}

export function useWallet() {
  return useContext(WalletContext)
}
