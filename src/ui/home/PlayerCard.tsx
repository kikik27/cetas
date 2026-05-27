'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Crown, Flame, Pencil, X, Check, Loader2, CircleCheck, CircleX } from 'lucide-react'
import { useWallet } from '@/src/providers/WalletProvider'
import { usePlayer, useUpdatePlayer } from '@/src/hooks/usePlayer'
import { useCheckName } from '@/src/hooks/useCheckName'
import { formatCETAS, useBalanceOf } from '@/src/hooks/useCetasContracts'
import AvatarPicker from './AvatarPicker'
import { cn } from '@/src/lib/utils'

export default function PlayerCard() {
  const { player: walletPlayer, authStatus, updatePlayer } = useWallet()
  const updateMutation = useUpdatePlayer()
  const { data: queryPlayer, isLoading } = usePlayer(authStatus === 'authenticated')
  const player = queryPlayer ?? walletPlayer
  const wallet = player?.walletAddress as `0x${string}` | undefined
  const { data: onchainPoints, isLoading: pointsLoading } = useBalanceOf(wallet)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [renaming,   setRenaming]   = useState(false)
  const [nameInput,  setNameInput]  = useState('')

  const name            = player?.name            ?? 'Commander'
  const avatarIdx       = player?.avatarIdx       ?? 1
  const experience      = player?.experience      ?? 0
  const streakDays      = player?.streakDays      ?? 0
  const level           = player?.level           ?? 1
  const nameChangesLeft = player?.nameChangesLeft ?? 0

  // Only check availability when renaming and name differs from current
  const skipCheck = !renaming || nameInput.trim() === name
  const nameCheck = useCheckName(nameInput, 400, skipCheck)

  const xpForNext = level * 500
  const xpCurrent = experience % xpForNext
  const xpPct     = Math.min(100, Math.round((xpCurrent / xpForNext) * 100))
  const pad        = String(avatarIdx).padStart(2, '0')

  const nameInputTrimmed = nameInput.trim()
  const canSubmitRename =
    nameInputTrimmed.length >= 2 &&
    nameInputTrimmed !== name &&
    nameCheck.status === 'available'

  async function handleSelectAvatar(idx: number) {
    setPickerOpen(false)
    try {
      const updated = await updateMutation.mutateAsync({ avatarIdx: idx })
      updatePlayer({ avatarIdx: updated.avatarIdx })
    } catch { /* silent */ }
  }

  function startRename() {
    setNameInput(name)
    setRenaming(true)
  }

  function cancelRename() {
    setRenaming(false)
    setNameInput('')
  }

  async function submitRename() {
    const trimmed = nameInputTrimmed
    if (!trimmed || trimmed === name) { cancelRename(); return }
    if (!canSubmitRename) return

    try {
      const updated = await updateMutation.mutateAsync({ name: trimmed })
      updatePlayer({ name: updated.name, nameChangesLeft: updated.nameChangesLeft })
      setRenaming(false)
    } catch (err) {
      // error shown via mutation state
      console.error(err)
    }
  }

  const renameError = updateMutation.error instanceof Error
    ? updateMutation.error.message
    : nameCheck.status === 'taken' || nameCheck.status === 'invalid'
    ? nameCheck.message
    : null

  if (authStatus === 'authenticated' && isLoading && !player) {
    return <PlayerCardLoading />
  }

  return (
    <>
      <AvatarPicker
        open={pickerOpen}
        current={avatarIdx}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectAvatar}
      />

      <section className="relic-frame flex items-center gap-3 px-4 py-4">
        {/* Avatar */}
        <button
          onClick={() => setPickerOpen(true)}
          aria-label="Change avatar"
          className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl
                     border-2 border-[var(--border-gold)] transition-colors hover:border-[var(--gold-hi)]"
        >
          <Image
            src={`/assets/ui/avatars/avatar-${pad}.png`}
            alt="Player avatar"
            width={64} height={64}
            loading="eager"
            unoptimized
            className="pixel h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center
                          bg-black/0 transition-colors group-hover:bg-black/40">
            <span className="font-display text-[9px] font-bold uppercase tracking-wider
                             text-[var(--gold-hi)] opacity-0 transition-opacity group-hover:opacity-100">
              Edit
            </span>
          </div>
        </button>

        {/* Name + XP */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Crown className="h-3 w-3 flex-shrink-0 text-[var(--gold-mid)]" />
            <span className="font-display text-[10px] uppercase tracking-wider text-[var(--gold-mid)]">
              Level {level}
            </span>
          </div>

          {/* Name row */}
          {renaming ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                {/* Input */}
                <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value.slice(0, 20))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && canSubmitRename) submitRename()
                      if (e.key === 'Escape') cancelRename()
                    }}
                    autoFocus
                    maxLength={20}
                    className={cn(
                      'w-full rounded-lg border bg-[rgba(200,146,42,0.08)] px-2 py-1 pr-7',
                      'font-display text-[13px] text-[var(--text-1)] outline-none transition-all',
                      nameCheck.status === 'taken' || nameCheck.status === 'invalid'
                        ? 'border-[var(--enemy)]'
                        : nameCheck.status === 'available'
                        ? 'border-[var(--ok)]'
                        : 'border-[var(--border-gold)] focus:border-[var(--gold-hi)]'
                    )}
                  />
                  {/* Inline status icon */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {nameCheck.status === 'checking' && (
                      <Loader2 className="h-3 w-3 animate-spin text-[var(--text-dim)]" />
                    )}
                    {nameCheck.status === 'available' && (
                      <CircleCheck className="h-3 w-3 text-[var(--ok)]" />
                    )}
                    {(nameCheck.status === 'taken' || nameCheck.status === 'invalid') && (
                      <CircleX className="h-3 w-3 text-[var(--enemy)]" />
                    )}
                  </div>
                </div>

                {/* Confirm */}
                <button
                  onClick={submitRename}
                  disabled={!canSubmitRename || updateMutation.isPending}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center
                             rounded-lg border border-[rgba(61,186,106,0.5)]
                             bg-[rgba(61,186,106,0.12)] text-[var(--ok)]
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Check className="h-3 w-3" />
                  }
                </button>

                {/* Cancel */}
                <button
                  onClick={cancelRename}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center
                             rounded-lg border border-[var(--border)] text-[var(--text-3)]
                             hover:border-[var(--enemy)] hover:text-[var(--enemy)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Error / status message */}
              {renameError && (
                <p className="text-[9px] text-[var(--enemy)]">{renameError}</p>
              )}
              {nameCheck.status === 'available' && (
                <p className="text-[9px] text-[var(--ok)]">Name is available</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="truncate font-display text-[16px] font-bold leading-tight text-[var(--text-1)]">
                {name}
              </p>
              {nameChangesLeft > 0 && (
                <button
                  onClick={startRename}
                  title={`Rename (${nameChangesLeft} change left)`}
                  className="flex-shrink-0 rounded-md p-0.5 text-[var(--text-dim)]
                             transition-colors hover:text-[var(--gold-mid)]"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* XP bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="stat-bar flex-1">
              <div
                className="stat-bar-fill bg-gradient-to-r from-[var(--gold-lo)] to-[var(--gold-hi)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="flex-shrink-0 tabular-nums text-[9px] text-[var(--text-3)]">
              {xpCurrent}/{xpForNext} xp
            </span>
          </div>
        </div>

        {/* Points badge */}
        <div className="flex min-w-[64px] flex-shrink-0 flex-col items-center gap-0.5
                        rounded-xl border border-[var(--border-gold)]
                        bg-[rgba(200,146,42,0.08)] px-3 py-2.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
            CETAS
          </span>
          <span className="font-display text-[17px] font-bold leading-none tabular-nums text-[var(--gold-hi)]">
            {pointsLoading ? '...' : formatCETAS(onchainPoints as bigint | undefined)}
          </span>
          <div className="mt-0.5 flex items-center gap-0.5">
            <Flame className="h-2.5 w-2.5 text-[var(--warn)]" />
            <span className="text-[9px] text-[var(--warn)]">{streakDays}d</span>
          </div>
        </div>
      </section>
    </>
  )
}

function PlayerCardLoading() {
  return (
    <section className="relic-frame flex items-center gap-3 px-4 py-4">
      <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-xl border-2 border-[var(--border-gold)] bg-[rgba(200,146,42,0.08)]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[rgba(200,146,42,0.16)]" />
        <div className="h-4 w-36 animate-pulse rounded-full bg-[rgba(255,255,255,0.08)]" />
        <div className="h-2 w-full animate-pulse rounded-full bg-[rgba(11,78,162,0.25)]" />
      </div>
      <div className="h-14 w-16 flex-shrink-0 animate-pulse rounded-xl border border-[var(--border-gold)] bg-[rgba(200,146,42,0.08)]" />
    </section>
  )
}
