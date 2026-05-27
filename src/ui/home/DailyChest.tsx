'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Zap, Loader2, AlertTriangle } from 'lucide-react'
import { Modal } from '@/src/components/ui/Modal'
import { Button } from '@/src/components/ui/Button'
import { useWallet } from '@/src/providers/WalletProvider'
import { useBalanceOf, useCanClaimDaily, useDailyClaimMutation, useTxReceipt, useChainStatus } from '@/src/hooks/useCetasContracts'
import { cn } from '@/src/lib/utils'

export default function DailyChest() {
  const { wallet, authStatus } = useWallet()
  const isReady = authStatus === 'authenticated' && !!wallet
  const { isCorrectChain, switchToMainnet } = useChainStatus()

  const { data: canClaim, isLoading: claimLoading, refetch: refetchCanClaim } = useCanClaimDaily(wallet as `0x${string}`)
  const { refetch: refetchBalance } = useBalanceOf(wallet as `0x${string}`)
  const { claim, isPending } = useDailyClaimMutation()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const { data: receipt, isLoading: isConfirming } = useTxReceipt(txHash)
  const syncedTxRef = useRef<`0x${string}` | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [animating, setAnimating] = useState(false)

  const claimConfirmed = receipt?.status === 'success'
  const claimFailed = receipt?.status === 'reverted'
  const claimed = claimConfirmed || (!claimLoading && canClaim === false)
  const isBusy = !isReady || claimLoading || isPending || isConfirming || animating

  const needsChainSwitch = isReady && !isCorrectChain

  useEffect(() => {
    if (!txHash || !claimConfirmed || syncedTxRef.current === txHash) return
    syncedTxRef.current = txHash
    void Promise.all([refetchBalance(), refetchCanClaim()])
  }, [claimConfirmed, refetchBalance, refetchCanClaim, txHash])

  async function handleSwitchChain() {
    switchToMainnet()
  }

  async function handleClaim() {
    if (claimed || isBusy || animating) return
    setAnimating(true)
    setTimeout(async () => {
      try {
        const tx = await claim()
        setTxHash(tx)
        setShowModal(true)
      } catch {
        // silent
      }
      setAnimating(false)
    }, 600)
  }

  return (
    <>
      {/* ── Reward modal ── */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="rpg-modal-bar" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-6 text-center">
          {/* Chest icon */}
          <div className="chest-open-anim flex h-14 w-14 items-center justify-center rounded-2xl
                          border-2 border-[var(--border-gold)] bg-[rgba(200,146,42,0.12)]
                          shadow-[0_0_24px_rgba(200,146,42,0.4)]">
            <Image
              src="/assets/ui/opened_chest.png"
              alt="Opened chest"
              width={40} height={40}
              unoptimized
              className="pixel object-contain"
            />
          </div>

          {/* Reward display */}
          <div className="flex flex-col items-center gap-1">
            <p className="font-display text-[10px] uppercase tracking-[0.22em] text-[var(--text-3)]">
              Daily Reward
            </p>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-[var(--ally)]" />
              <p className="font-display text-[32px] font-bold leading-none text-[var(--ally)]">
                +10 CETAS
              </p>
            </div>
            <p className="font-display text-[13px] uppercase tracking-wider text-[var(--text-2)]">
              {isConfirming ? 'Confirming...' : claimConfirmed ? 'Claimed!' : claimFailed ? 'Claim failed' : 'On-chain Daily Claim'}
            </p>
          </div>

          <div className="divider-gold w-full" />

          <Button
            variant="pixelGold"
            size="md"
            className="w-full"
            onClick={() => setShowModal(false)}
          >
            Collect
          </Button>
        </div>
      </Modal>

      {/* ── Chest button ── */}
      {needsChainSwitch ? (
        <button
          onClick={handleSwitchChain}
          className="relic-frame flex w-full items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:border-[var(--warn)] transition-all bg-[rgba(224,128,32,0.08)]"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[rgba(224,128,32,0.4)] bg-[rgba(224,128,32,0.12)]">
            <AlertTriangle className="h-5 w-5 text-[var(--warn)]" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--warn)]">
              Wrong Network
            </p>
            <p className="text-[9px] text-[var(--text-2)]">
              Switch to Celo
            </p>
          </div>
        </button>
      ) : (
      <button
        onClick={handleClaim}
        disabled={claimed || isBusy}
        aria-label="Claim daily CETAS"
        className={cn(
          'relic-frame flex w-full items-center gap-2.5 px-3 py-2.5 transition-all',
          claimed || isBusy
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-[var(--gold-hi)] chest-glow',
          animating && 'chest-shake'
        )}
      >
        <div className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-all',
          claimed
            ? 'border-[var(--border)] bg-[rgba(11,78,162,0.1)]'
            : 'border-[var(--border-gold)] bg-[rgba(200,146,42,0.12)]',
          animating && 'chest-bounce'
        )}>
          {isConfirming ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--gold-hi)]" />
          ) : (
            <Image
              src={claimed ? '/assets/ui/opened_chest.png' : '/assets/ui/closed_chest.png'}
              alt=""
              width={24} height={24}
              unoptimized
              className="pixel object-contain"
            />
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
            Daily Reward
          </p>
          <p className={cn(
            'text-[9px]',
            claimed || isBusy
              ? 'text-[var(--text-3)]'
              : 'animate-pulse font-semibold text-[var(--ok)]'
          )}>
            {isBusy ? 'Loading...' : claimed ? 'Come back tomorrow' : 'Claim 10 CETAS'}
          </p>
        </div>
      </button>
      )}
    </>
  )
}
