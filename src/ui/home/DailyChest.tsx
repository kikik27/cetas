'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Gift } from 'lucide-react'
import { Modal } from '@/src/components/ui/Modal'
import { Button } from '@/src/components/ui/Button'
import { useHomeStore, type ChestReward } from '@/src/lib/homeStore'
import { cn } from '@/src/lib/utils'

export default function DailyChest() {
  const { chestOpened, openChest } = useHomeStore()
  const [animating, setAnimating]  = useState(false)
  const [reward,    setReward]     = useState<ChestReward | null>(null)
  const [showModal, setShowModal]  = useState(false)

  function handleOpen() {
    if (chestOpened || animating) return
    setAnimating(true)
    setTimeout(() => {
      const r = openChest()
      setAnimating(false)
      if (r) { setReward(r); setShowModal(true) }
    }, 600)
  }

  return (
    <>
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="rpg-modal-bar" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-6 text-center">
          <div className="chest-open-anim flex h-14 w-14 items-center justify-center rounded-2xl
                          border-2 border-[var(--border-gold)] bg-[rgba(200,146,42,0.12)]
                          shadow-[0_0_24px_rgba(200,146,42,0.4)]">
            <Image
              src="/assets/ui/opened_chest.png"
              alt="Opened chest"
              width={40}
              height={40}
              unoptimized
              className="pixel object-contain"
            />
          </div>
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.22em] text-[var(--text-3)]">You received</p>
            <p className="mt-1 font-display text-[24px] font-bold text-[var(--gold-hi)]">+{reward?.amount}</p>
            <p className="font-display text-[13px] uppercase tracking-wider text-[var(--gold-mid)]">{reward?.label}</p>
          </div>
          <div className="divider-gold w-full" />
          <Button variant="pixelGold" size="md" className="w-full" onClick={() => setShowModal(false)}>
            Claim Reward
          </Button>
        </div>
      </Modal>

      {/* Compact horizontal row */}
      <button
        onClick={handleOpen}
        disabled={chestOpened}
        aria-label="Open daily reward"
        className={cn(
          'relic-frame flex w-full items-center gap-2.5 px-3 py-2.5 transition-all',
          chestOpened
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-[var(--gold-hi)] chest-glow',
          animating && 'chest-shake'
        )}
      >
      {/* Icon — chest asset, open/closed state */}
        <div className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-all',
          chestOpened
            ? 'border-[var(--border)] bg-[rgba(11,78,162,0.1)]'
            : 'border-[var(--border-gold)] bg-[rgba(200,146,42,0.12)]',
          animating && 'chest-bounce'
        )}>
          <Image
            src={chestOpened ? '/assets/ui/opened_chest.png' : '/assets/ui/closed_chest.png'}
            alt={chestOpened ? 'Opened chest' : 'Closed chest'}
            width={24}
            height={24}
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
            chestOpened ? 'text-[var(--text-3)]' : 'animate-pulse font-semibold text-[var(--ok)]'
          )}>
            {chestOpened ? 'Come back tomorrow' : 'Available!'}
          </p>
        </div>
      </button>
    </>
  )
}
