'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Zap } from 'lucide-react'
import { Modal } from '@/src/components/ui/Modal'
import { Button } from '@/src/components/ui/Button'
import { useDailyClaimStatus, useOpenChest } from '@/src/hooks/useDailyClaim'
import { useWallet } from '@/src/providers/WalletProvider'
import { cn } from '@/src/lib/utils'

export default function DailyChest() {
  const { authStatus } = useWallet()
  const isReady = authStatus === 'authenticated'

  const { data: claimStatus } = useDailyClaimStatus(isReady)
  const openChestMutation     = useOpenChest()

  const [showModal, setShowModal] = useState(false)
  const [animating, setAnimating] = useState(false)

  const chestOpened = claimStatus?.claimed ?? false
  const reward      = openChestMutation.data ?? claimStatus?.reward

  async function handleOpen() {
    if (chestOpened || animating || openChestMutation.isPending) return
    setAnimating(true)
    setTimeout(async () => {
      try {
        await openChestMutation.mutateAsync()
        setShowModal(true)
      } catch {
        // silent — chest stays closed
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
                +{reward?.amount}
              </p>
            </div>
            <p className="font-display text-[13px] uppercase tracking-wider text-[var(--text-2)]">
              XP
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
      <button
        onClick={handleOpen}
        disabled={chestOpened || !isReady}
        aria-label="Open daily reward"
        className={cn(
          'relic-frame flex w-full items-center gap-2.5 px-3 py-2.5 transition-all',
          chestOpened || !isReady
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-[var(--gold-hi)] chest-glow',
          animating && 'chest-shake'
        )}
      >
        <div className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-all',
          chestOpened
            ? 'border-[var(--border)] bg-[rgba(11,78,162,0.1)]'
            : 'border-[var(--border-gold)] bg-[rgba(200,146,42,0.12)]',
          animating && 'chest-bounce'
        )}>
          <Image
            src={chestOpened ? '/assets/ui/opened_chest.png' : '/assets/ui/closed_chest.png'}
            alt=""
            width={24} height={24}
            unoptimized
            className="pixel object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
            Daily Reward
          </p>
          <p className={cn(
            'text-[9px]',
            chestOpened || !isReady
              ? 'text-[var(--text-3)]'
              : 'animate-pulse font-semibold text-[var(--ok)]'
          )}>
            {!isReady ? 'Loading…' : chestOpened ? 'Come back tomorrow' : 'XP available!'}
          </p>
        </div>

        {/* XP badge — only when available */}
        {!chestOpened && isReady && (
          <div className="flex items-center gap-1 rounded-lg border border-[rgba(74,158,255,0.4)]
                          bg-[rgba(74,158,255,0.1)] px-2 py-1">
            <Zap className="h-3 w-3 text-[var(--ally)]" />
            <span className="font-display text-[9px] font-bold text-[var(--ally)]">XP</span>
          </div>
        )}
      </button>
    </>
  )
}
