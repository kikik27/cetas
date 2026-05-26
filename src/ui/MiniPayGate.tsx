'use client'

/**
 * MiniPayGate — auth guard for hub pages (/home, /tasks, etc.)
 *
 * Shows a loading spinner while connecting/authenticating.
 * Shows an error state if not running inside MiniPay (production only).
 * In development, always passes through.
 */

import { useWallet } from '@/src/providers/WalletProvider'

interface MiniPayGateProps {
  children: React.ReactNode
}

export default function MiniPayGate({ children }: MiniPayGateProps) {
  const { authStatus, connecting, isMiniPay } = useWallet()

  // Dev: always pass through
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>
  }

  // Connecting or authenticating
  if (connecting || authStatus === 'restoring' || authStatus === 'logging-in') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-gold)] border-t-[var(--gold-mid)]" />
          <p className="font-display text-[12px] uppercase tracking-[0.2em] text-[var(--gold-mid)]">
            Connecting to MiniPay…
          </p>
        </div>
      </div>
    )
  }

  // Not authenticated and not in MiniPay
  if (authStatus === 'unauthenticated' || authStatus === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-6">
        <div className="relic-frame flex max-w-[320px] flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="rpg-modal-bar w-full" />
          <p className="font-display text-[18px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
            MiniPay Required
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
            {authStatus === 'error'
              ? 'Connection failed. Unlock MiniPay and try again.'
              : 'Please open this app from the MiniPay wallet to continue.'}
          </p>
          {isMiniPay && (
            <p className="text-[11px] text-[var(--ok)]">MiniPay detected — retrying…</p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
