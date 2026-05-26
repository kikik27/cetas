/**
 * Wagmi config for MiniPay Mini App.
 *
 * Rules from docs.minipay.xyz:
 * - Use injected() connector — MiniPay injects window.ethereum automatically
 * - Only Celo chains (mainnet + Sepolia testnet)
 * - http() transport is sufficient; custom() transport only needed if you
 *   want every RPC call to go through the injected provider
 */
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { celo, celoSepolia } from 'wagmi/chains'

export const wagmiConfig = createConfig({
  chains: [celo, celoSepolia],
  connectors: [injected()],
  transports: {
    [celo.id]:        http(),
    [celoSepolia.id]: http(),
  },
})

/**
 * Detect if the app is running inside MiniPay.
 * Only call this client-side (after mount).
 */
export function isMiniPayEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay
}

/**
 * Get the injected ethereum provider.
 * Throws a clear error if not running inside MiniPay.
 */
export function getEthereumProvider() {
  if (typeof window === 'undefined' || !(window as unknown as { ethereum?: unknown }).ethereum) {
    throw new Error(
      'window.ethereum is required. Please open this app inside MiniPay.'
    )
  }
  return (window as unknown as { ethereum: NonNullable<unknown> }).ethereum
}
