/**
 * Wagmi config for MiniPay Mini App.
 * Supports both Celo Sepolia (testnet) and Celo (mainnet).
 */
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { celo, celoSepolia } from 'wagmi/chains'

export const wagmiConfig = createConfig({
  chains: [celo, celoSepolia],
  connectors: [injected()],
  transports: {
    [celo.id]:        http('https://forno.celo.org'),
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia'),
  },
})

/** Detect if running inside MiniPay */
export function isMiniPayEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay
}
