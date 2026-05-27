'use client'

import { useCallback } from 'react'
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
  useSwitchChain,
} from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { celo, celoSepolia } from 'wagmi/chains'
import {
  CetasPointsABI,
  CetasTreasuryABI,
  SEPOLIA,
  MAINNET,
  CETAS_DECIMALS,
} from '@/src/lib/contracts'

export function useChainStatus() {
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const isSepolia = chainId === celoSepolia.id
  const isMainnet = chainId === celo.id

  return {
    isSepolia,
    isMainnet,
    isCorrectChain: isSepolia || isMainnet,
    chainId,
    targetChainId: isSepolia ? celo.id : celoSepolia.id,
    targetChainName: isSepolia ? 'Celo Mainnet' : 'Celo Sepolia',
    switchToSepolia: () => switchChain({ chainId: celoSepolia.id }),
    switchToMainnet: () => switchChain({ chainId: celo.id }),
  }
}

function useAddrs() {
  const { chainId } = useAccount()
  if (chainId === celo.id) return MAINNET
  if (chainId === celoSepolia.id) return SEPOLIA
  return null
}
// ─── CetasPoints: Read ──────────────────────────────────────────────────

export function useBalanceOf(address?: Address) {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasPoints,
    abi: CetasPointsABI as any,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addr },
  })
}

export function useCanClaimDaily(address?: Address) {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasPoints,
    abi: CetasPointsABI as any,
    functionName: 'canClaimDaily',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addr },
  })
}

export function useDailyClaimAmount() {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasPoints,
    abi: CetasPointsABI as any,
    functionName: 'dailyClaimAmount',
    query: { enabled: !!addr },
  })
}

export function useAllowance(owner?: Address, spender?: Address) {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasPoints,
    abi: CetasPointsABI as any,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!owner && !!spender && !!addr },
  })
}

// ─── CetasPoints: Write ─────────────────────────────────────────────────

export function useDailyClaimMutation() {
  const addr = useAddrs()
  const { writeContractAsync, ...rest } = useWriteContract()
  const claim = useCallback(() => {
    if (!addr) throw new Error('No contract address')
    return writeContractAsync({
      address: addr.CetasPoints,
      abi: CetasPointsABI as any,
      functionName: 'dailyClaim',
    })
  }, [writeContractAsync, addr])
  return { claim, ...rest }
}

export function useApproveMutation() {
  const addr = useAddrs()
  const { writeContractAsync, ...rest } = useWriteContract()
  const approve = useCallback((spender: Address, amount: bigint) => {
    if (!addr) throw new Error('No contract address')
    return writeContractAsync({
      address: addr.CetasPoints,
      abi: CetasPointsABI as any,
      functionName: 'approve',
      args: [spender, amount],
    })
  }, [writeContractAsync, addr])
  return { approve, ...rest }
}

// ─── CetasTreasury: Read ────────────────────────────────────────────────

export function useExchangeRate() {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasTreasury,
    abi: CetasTreasuryABI as any,
    functionName: 'exchangeRate',
    query: { enabled: !!addr },
  })
}

export function usePreviewSwap(pointsAmount?: bigint) {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasTreasury,
    abi: CetasTreasuryABI as any,
    functionName: 'previewSwap',
    args: pointsAmount !== undefined ? [pointsAmount] : undefined,
    query: { enabled: pointsAmount !== undefined && pointsAmount > BigInt(0) && !!addr },
  })
}

export function useSwapPaused() {
  const addr = useAddrs()
  return useReadContract({
    address: addr?.CetasTreasury,
    abi: CetasTreasuryABI as any,
    functionName: 'paused',
    query: { enabled: !!addr },
  })
}

// ─── CetasTreasury: Write ───────────────────────────────────────────────

export function useSwapMutation() {
  const addr = useAddrs()
  const { writeContractAsync, ...rest } = useWriteContract()
  const swap = useCallback((pointsAmount: bigint) => {
    if (!addr) throw new Error('No contract address')
    return writeContractAsync({
      address: addr.CetasTreasury,
      abi: CetasTreasuryABI as any,
      functionName: 'swapPointsToCelo',
      args: [pointsAmount],
    })
  }, [writeContractAsync, addr])
  return { swap, ...rest }
}

// ─── Helpers ────────────────────────────────────────────────────────────

export function useTxReceipt(hash?: Address) {
  return useWaitForTransactionReceipt({ hash })
}

export function toCETASWei(amount: string | number): bigint {
  return parseUnits(String(amount), Number(CETAS_DECIMALS))
}

export function formatCETAS(wei?: bigint | null): string {
  if (!wei) return '0'
  const formatted = formatUnits(wei, Number(CETAS_DECIMALS))
  const num = parseFloat(formatted)
  if (num < 0.001 && num > 0) return '<0.001'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(3).replace(/\.?0+$/, '')
}
