'use client'

/**
 * WalletProvider — MiniPay wallet + auth session context.
 *
 * Combines:
 * - wagmi auto-connect (MiniPay injects window.ethereum)
 * - useAuth: restore session on mount → login when address appears
 * - Exposes player profile, auth status, and onboarding flag
 *
 * Rules from docs.minipay.xyz:
 * - Auto-connect on page load, NEVER show a connect button
 * - Do NOT sign a message for authentication
 * - window.ethereum?.isMiniPay to detect environment
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { useConnection } from 'wagmi'
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
})

// ─── Inner bridge — must live inside WagmiProvider ───────────────────────────

function WalletContextBridge({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useConnection()
  const { error: connectError, isPending }     = useAutoConnect()
  const [isMiniPay, setIsMiniPay]              = useState(() => isMiniPayEnvironment())

  // Dev fallback: stable mock address when no MiniPay available
  const [devWallet, setDevWallet] = useState<string | null>(null)

  useEffect(() => {
    const detectMiniPay = async () => {
      setIsMiniPay(isMiniPayEnvironment())
    }
    void detectMiniPay()
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (address) return

    const loadDevWallet = async () => {
      const stored = localStorage.getItem('cetas_dev_wallet')
      if (stored) { setDevWallet(stored); return }

      const mock = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      localStorage.setItem('cetas_dev_wallet', mock)
      setDevWallet(mock)
    }

    void loadDevWallet()
  }, [address])

  const effectiveWallet   = address?.toLowerCase() ?? devWallet ?? null
  const effectiveConnected = isConnected || (process.env.NODE_ENV === 'development' && !!devWallet)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { status: authStatus, player, isNewPlayer, updatePlayer, signOut } =
    useAuth(effectiveWallet)

  const connecting =
    isConnecting ||
    isPending ||
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
