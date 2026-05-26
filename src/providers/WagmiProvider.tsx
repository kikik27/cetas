'use client'

/**
 * WagmiProvider — wraps the app with Wagmi context.
 * Must be a client component because wagmi uses React context + hooks.
 */
import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { wagmiConfig } from '@/src/lib/wagmi'

export default function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProviderBase config={wagmiConfig}>
      {children}
    </WagmiProviderBase>
  )
}
