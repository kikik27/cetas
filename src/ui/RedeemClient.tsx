'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Coins,
  Loader2,
  Wallet,
} from 'lucide-react'
import { Button } from '@/src/components/ui/Button'
import { StatTile } from '@/src/components/ui/StatTile'
import { useWallet } from '@/src/providers/WalletProvider'
import { cn } from '@/src/lib/utils'
import { formatCelo } from '@/src/lib/format'
import {
  useBalanceOf,
  useAllowance,
  usePreviewSwap,
  useExchangeRate,
  useSwapPaused,
  useApproveMutation,
  useSwapMutation,
  useTxReceipt,
  useChainStatus,
  toCETASWei,
  formatCETAS,
} from '@/src/hooks/useCetasContracts'
import { MAINNET } from '@/src/lib/contracts'

const QUICK_PRESETS = [10, 25, 50, 100]

type Step = 'input' | 'approving' | 'swapping'
type ToastKind = 'success' | 'error'

export default function RedeemClient() {
  const { wallet, authStatus } = useWallet()
  const isReady = authStatus === 'authenticated' && !!wallet
  const w = wallet as `0x${string}` | undefined
  const { isCorrectChain, switchToMainnet } = useChainStatus()
  const needsChainSwitch = isReady && !isCorrectChain

  // ── On-chain reads ──────────────────────────────────────────────────────────
  const { data: balanceWei, refetch: refetchBalance } = useBalanceOf(w)
  const { data: exchangeRate } = useExchangeRate()
  const { data: swapPaused } = useSwapPaused()
  const { data: allowanceWei, refetch: refetchAllowance } = useAllowance(w, MAINNET.CetasTreasury)

  // ── State ────────────────────────────────────────────────────────────────────
  const [amount, setAmount] = useState('50')
  const parsedAmount = Math.max(0, Number.parseInt(amount.replace(/\D/g, ''), 10) || 0)
  const amountWei = useMemo(() => parsedAmount > 0 ? toCETASWei(parsedAmount) : BigInt(0), [parsedAmount])
  const { data: previewWei } = usePreviewSwap(amountWei > BigInt(0) ? amountWei : undefined)

  // ── Transaction ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('input')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [settlementHash, setSettlementHash] = useState<`0x${string}` | undefined>(undefined)
  const settledSwapRef = useRef<`0x${string}` | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toastKind, setToastKind] = useState<ToastKind>('success')
  const [pendingSwapSummary, setPendingSwapSummary] = useState('')
  const approveMutation = useApproveMutation()
  const swapMutation = useSwapMutation()
  const { data: receipt, isLoading: isConfirming } = useTxReceipt(txHash)

  // ── Derived ──────────────────────────────────────────────────────────────────
  const balance = balanceWei as bigint | undefined
  const allowance = allowanceWei as bigint | undefined
  const needsApproval = allowance !== undefined && amountWei > BigInt(0) && amountWei > allowance
  const hasBalance = balance !== undefined && amountWei <= balance
  const rateDisplay = exchangeRate
    ? `1,000 CETAS = ${formatCelo(Number(exchangeRate) * 1000 / 1e18)} CELO`
    : 'Loading...'

  const validationMessage =
    !isReady ? 'Connect your wallet to swap.'
    : needsChainSwitch ? `Switch to Celo to swap.`
    : swapPaused ? 'Swap is currently paused.'
    : parsedAmount <= 0 ? 'Enter an amount.'
    : !hasBalance ? 'Insufficient CETAS balance.'
    : null

  const canSwap = !validationMessage && parsedAmount > 0 && step === 'input'

  async function handleSwap() {
    if (!canSwap) return
    setToast(null)
    setSettlementHash(undefined)

    try {
      if (needsApproval) {
        setStep('approving')
        const approveTx = await approveMutation.approve(MAINNET.CetasTreasury, amountWei)
        setTxHash(approveTx)
        await refetchAllowance()
      }

      setStep('swapping')
      const swapTx = await swapMutation.swap(amountWei)
      setTxHash(swapTx)
      setSettlementHash(swapTx)
      setPendingSwapSummary(`Swapped ${parsedAmount} CETAS for ~${previewWei ? formatCelo(Number(previewWei) / 1e18) : '...'} CELO`)
    } catch (err) {
      setStep('input')
      setToastKind('error')
      setToast(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  useEffect(() => {
    if (!settlementHash || !receipt || settledSwapRef.current === settlementHash) return
    if (receipt.transactionHash.toLowerCase() !== settlementHash.toLowerCase()) return

    settledSwapRef.current = settlementHash
    void (async () => {
      try {
        if (receipt.status !== 'success') {
          setToastKind('error')
          setToast('Swap transaction reverted.')
          return
        }

        await Promise.all([refetchBalance(), refetchAllowance()])
        setToastKind('success')
        setToast(pendingSwapSummary || 'Swap complete. Balance refreshed.')
      } catch {
        setToastKind('success')
        setToast(pendingSwapSummary || 'Swap complete. Refresh your balance if it looks stale.')
      } finally {
        setStep('input')
        setSettlementHash(undefined)
        setTxHash(undefined)
      }
    })()
  }, [pendingSwapSummary, receipt, refetchAllowance, refetchBalance, settlementHash])

  const isBusy = step !== 'input' || approveMutation.isPending || swapMutation.isPending || isConfirming
  const buttonLabel = step === 'approving' ? 'Approving CETAS...'
    : step === 'swapping' ? 'Swapping...'
    : needsApproval ? 'Approve & Swap'
    : 'Swap to CELO'

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-shrink-0 items-center gap-2 px-1">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)]">
          <Image src="/assets/celo/logo-symbol.png" alt="" width={18} height={18} unoptimized className="object-contain" />
        </div>
        <div>
          <h1 className="font-display text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
            Swap CETAS
          </h1>
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">
            CETAS → CELO
          </p>
        </div>
        <span className={cn(
          'ml-auto rounded-full px-2 py-1 font-display text-[8px] font-bold uppercase tracking-wider border',
          swapPaused
            ? 'border-[rgba(224,48,48,0.35)] bg-[rgba(224,48,48,0.1)] text-[var(--enemy)]'
            : 'border-[rgba(61,186,106,0.35)] bg-[rgba(61,186,106,0.1)] text-[var(--ok)]'
        )}>
          {swapPaused ? 'Paused' : 'Live'}
        </span>
      </div>

      <div className="game-scroll flex flex-1 flex-col gap-3 overflow-y-auto">
        {/* Stats */}
        <section className="grid flex-shrink-0 grid-cols-2 gap-2">
          <StatTile
            icon={<Coins className="h-4 w-4 text-[var(--gold-hi)]" />}
            label="CETAS Balance"
            value={balance !== undefined ? formatCETAS(balance) : '...'}
          />
          <StatTile
            icon={<Image src="/assets/celo/logo-symbol.png" alt="" width={18} height={18} unoptimized className="object-contain" />}
            label="Est. Receive"
            value={previewWei ? `${formatCelo(Number(previewWei) / 1e18)} CELO` : '...'}
          />
        </section>

        {/* Swap input */}
        <section className="relic-frame flex flex-col gap-3 px-4 py-4">
          <div className="relative z-[1] flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--gold-mid)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
              Swap Amount
            </span>
            <span className="ml-auto text-[9px] uppercase tracking-wider text-[var(--text-3)]">
              {rateDisplay}
            </span>
          </div>

          <div className="relative z-[1] rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.78)] px-3 py-3">
            <label htmlFor="swap-points" className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">
              CETAS to swap
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="swap-points"
                inputMode="numeric"
                type="text"
                pattern="[0-9]*"
                autoComplete="off"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="min-w-0 flex-1 rounded-md bg-transparent font-display text-[30px] font-black leading-none tabular-nums text-[var(--gold-hi)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-hi)]"
                aria-describedby="swap-validation"
              />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {QUICK_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={cn(
                    'h-8 rounded-lg border px-2 py-1.5 font-display text-[9px] font-bold tabular-nums transition-colors',
                    parsedAmount === p
                      ? 'border-[var(--gold-hi)] bg-[var(--gold-hi)] text-[var(--bg-deep)]'
                      : 'border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-2)]'
                  )}
                >
                  {p} CETAS
                </button>
              ))}
            </div>
          </div>

          {/* Swap preview */}
          <div className="relative z-[1] flex items-center justify-between rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.65)] px-4 py-3">
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-[var(--text-3)]">Spend</p>
              <p className="mt-0.5 font-display text-[12px] font-bold tabular-nums text-[var(--text-1)]">
                {parsedAmount} CETAS
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--gold-mid)]" />
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-[var(--text-3)]">Receive</p>
              <p className="mt-0.5 font-display text-[12px] font-bold tabular-nums text-[var(--gold-mid)]">
                {previewWei ? `${formatCelo(Number(previewWei) / 1e18)} CELO` : '...'}
              </p>
            </div>
          </div>

          {needsApproval && step === 'input' && (
            <p className="relative z-[1] flex items-center gap-1.5 text-[10px] text-[var(--ally)]">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              Approval required first — you&apos;ll sign 2 transactions.
            </p>
          )}

          {validationMessage && (
            <p id="swap-validation" className="relative z-[1] flex items-center gap-1.5 text-[10px] text-[var(--warn)]">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {validationMessage}
            </p>
          )}

          {toast && (
            <p className={cn(
              'relative z-[1] flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px]',
              toastKind === 'success'
                ? 'border-[rgba(61,186,106,0.25)] bg-[rgba(61,186,106,0.08)] text-[var(--ok)]'
                : 'border-[rgba(224,48,48,0.25)] bg-[rgba(224,48,48,0.08)] text-[var(--enemy)]'
            )}>
              <Check className="h-3 w-3 flex-shrink-0" />
              {toast}
            </p>
          )}

          <Button
            variant={needsChainSwitch ? "pixelDanger" : "pixelGold"}
            size="lg"
            onClick={needsChainSwitch ? switchToMainnet : handleSwap}
            disabled={needsChainSwitch ? false : (!canSwap || isBusy)}
            className="relative z-[1] w-full font-display text-[12px] font-black uppercase tracking-[0.16em]"
          >
            {needsChainSwitch ? (
              <><AlertTriangle className="h-4 w-4" />Switch to Celo</>
            ) : isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {needsChainSwitch ? `Switch to Celo` : buttonLabel}
          </Button>
        </section>
      </div>
    </div>
  )
}
