/**
 * Cetas on-chain contract addresses and configuration.
 */
import CetasPointsABI from './abi/CetasPoints.abi.json'
import CetasTreasuryABI from './abi/CetasTreasury.abi.json'

// ─── Testnet (Celo Sepolia) ──────────────────────────────────────────────
export const SEPOLIA = {
  CetasPoints:   '0x43912b8e299969B2Ef9B06207F850cad26767966' as `0x${string}`,
  CetasTreasury: '0x525ABbaeE90e882b359B4cB86e094B0738516292' as `0x${string}`,
} as const

// ─── Mainnet (Celo) ──────────────────────────────────────────────────────
// NOTE: Fill after mainnet deployment
export const MAINNET = {
  CetasPoints:   '0x0000000000000000000000000000000000000000' as `0x${string}`,
  CetasTreasury: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const

export { CetasPointsABI, CetasTreasuryABI }

/** Exchange rate: 1 CETAS = 0.001 CELO (configurable on-chain) */
export const SWAP_RATE_WEI = 1e15

/** CETAS decimals (ERC-20 = 18) */
export const CETAS_DECIMALS = 18
