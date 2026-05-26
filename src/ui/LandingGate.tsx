'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Swords, ChevronLeft, ChevronRight, Check, Loader2, CircleCheck, CircleX } from 'lucide-react'
import { Button } from '@/src/components/ui/Button'
import { Modal } from '@/src/components/ui/Modal'
import { useWallet } from '@/src/providers/WalletProvider'
import { useCheckName } from '@/src/hooks/useCheckName'
import { cn } from '@/src/lib/utils'

const AVATAR_COUNT = 25
type Step = 'name' | 'avatar'

export default function LandingGate({ className }: { className?: string }) {
  const router = useRouter()
  const { authStatus, isNewPlayer, connecting, isMiniPay, updatePlayer } = useWallet()

  const [open,      setOpen]      = useState(false)
  const [step,      setStep]      = useState<Step>('name')
  const [name,      setName]      = useState('')
  const [avatarIdx, setAvatarIdx] = useState(1)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Real-time name availability check
  const nameCheck = useCheckName(name, 400)
  const canProceed = nameCheck.status === 'available' || (name.trim().length >= 2 && nameCheck.status === 'idle')

  // Auto-open onboarding for new players
  useEffect(() => {
    if (authStatus === 'authenticated' && isNewPlayer && !open) {
      const openOnboarding = async () => {
        setStep('name')
        setOpen(true)
      }
      void openOnboarding()
    }
  }, [authStatus, isNewPlayer, open])

  function handlePlay() {
    if (connecting) return
    if (authStatus === 'authenticated') {
      if (isNewPlayer) {
        setOpen(true)
      } else {
        router.push('/home')
      }
      return
    }
    if (!isMiniPay && process.env.NODE_ENV === 'production') return
    router.push('/home')
  }

  function handleNameNext() {
    if (nameCheck.status === 'taken' || nameCheck.status === 'invalid') return
    if (name.trim().length < 2) return
    setStep('avatar')
  }

  async function handleFinish() {
    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch('/api/player', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ name: name.trim(), avatarIdx }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to save profile')

      updatePlayer(json.data)
      setOpen(false)
      router.push('/home')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const isLoading = connecting || authStatus === 'logging-in'
  const pad = String(avatarIdx).padStart(2, '0')

  // Name input status indicator
  const nameIndicator = () => {
    if (!name.trim()) return null
    switch (nameCheck.status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-[var(--text-dim)]" />
      case 'available':
        return <CircleCheck className="h-4 w-4 text-[var(--ok)]" />
      case 'taken':
      case 'invalid':
        return <CircleX className="h-4 w-4 text-[var(--enemy)]" />
      default:
        return null
    }
  }

  return (
    <>
      <Modal show={open} onClose={() => !saving && setOpen(false)} persistent={saving}>
        <div className="rpg-modal-bar" />

        {/* Step indicator */}
        <div className="relative z-10 flex items-center justify-center gap-3 px-6 pt-4 pb-2">
          {(['name', 'avatar'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border font-display text-[10px] font-bold transition-all',
                step === s
                  ? 'border-[var(--gold-mid)] bg-[rgba(200,146,42,0.2)] text-[var(--gold-hi)]'
                  : s === 'name' && step === 'avatar'
                  ? 'border-[var(--ok)] bg-[rgba(61,186,106,0.15)] text-[var(--ok)]'
                  : 'border-[var(--border)] text-[var(--text-3)]'
              )}>
                {s === 'name' && step === 'avatar' ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn(
                'font-display text-[9px] uppercase tracking-wider',
                step === s ? 'text-[var(--gold-mid)]' : 'text-[var(--text-3)]'
              )}>
                {s === 'name' ? 'Name' : 'Avatar'}
              </span>
              {i === 0 && <ChevronRight className="h-3 w-3 text-[var(--text-dim)]" />}
            </div>
          ))}
        </div>

        <div className="divider-gold mx-6" />

        {/* ── Step 1: Name ── */}
        {step === 'name' && (
          <div className="relative z-10 flex flex-col gap-4 px-6 py-5">
            <div>
              <h2 className="font-display text-[16px] font-bold text-[var(--gold-hi)]">
                Choose your name
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
                Shown on the leaderboard. You can rename once after this.
              </p>
            </div>

            {/* Input with inline status icon */}
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value.slice(0, 20))}
                  onKeyDown={e => e.key === 'Enter' && canProceed && handleNameNext()}
                  placeholder="e.g. IronWarlord"
                  maxLength={20}
                  autoFocus
                  className={cn(
                    'w-full rounded-xl border bg-[rgba(200,146,42,0.06)] px-4 py-2.5 pr-10',
                    'font-display text-[14px] text-[var(--text-1)]',
                    'placeholder:text-[var(--text-dim)] outline-none transition-all',
                    nameCheck.status === 'taken' || nameCheck.status === 'invalid'
                      ? 'border-[var(--enemy)]'
                      : nameCheck.status === 'available'
                      ? 'border-[var(--ok)]'
                      : 'border-[var(--border-gold)] focus:border-[var(--gold-hi)]'
                  )}
                />
                {/* Status icon inside input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {nameIndicator()}
                </div>
              </div>

              {/* Status message */}
              <div className="flex items-center justify-between">
                <p className={cn(
                  'text-[10px] transition-all',
                  nameCheck.status === 'available' ? 'text-[var(--ok)]'
                  : nameCheck.status === 'taken' || nameCheck.status === 'invalid' ? 'text-[var(--enemy)]'
                  : 'text-transparent'
                )}>
                  {nameCheck.message || '‎'}
                </p>
                <p className="text-[9px] text-[var(--text-dim)]">{name.length}/20</p>
              </div>
            </div>

            <Button
              variant="pixelGold"
              size="md"
              className="w-full font-black tracking-wider"
              onClick={handleNameNext}
              disabled={!canProceed || nameCheck.status === 'checking'}
            >
              {nameCheck.status === 'checking'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>
                : <>Continue <ChevronRight className="h-4 w-4" /></>
              }
            </Button>
          </div>
        )}

        {/* ── Step 2: Avatar ── */}
        {step === 'avatar' && (
          <div className="relative z-10 flex flex-col gap-4 px-6 py-5">
            <div>
              <h2 className="font-display text-[16px] font-bold text-[var(--gold-hi)]">
                Choose your avatar
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
                You can change this anytime from your profile.
              </p>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl
                              border-2 border-[var(--gold-mid)] shadow-[0_0_16px_rgba(200,146,42,0.4)]">
                <Image
                  src={`/assets/ui/avatars/avatar-${pad}.png`}
                  alt="Selected avatar"
                  width={56} height={56}
                  unoptimized
                  className="pixel h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-display text-[13px] font-bold text-[var(--text-1)]">
                  {name.trim()}
                </p>
                <p className="text-[10px] text-[var(--text-3)]">Avatar #{avatarIdx}</p>
              </div>
            </div>

            {/* Avatar grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
              {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map(n => {
                const p      = String(n).padStart(2, '0')
                const active = avatarIdx === n
                return (
                  <button
                    key={n}
                    onClick={() => setAvatarIdx(n)}
                    className={cn(
                      'relative overflow-hidden rounded-xl border-2 transition-all',
                      active
                        ? 'border-[var(--gold-mid)] shadow-[0_0_8px_rgba(200,146,42,0.5)]'
                        : 'border-[var(--border)] hover:border-[var(--border-gold)]'
                    )}
                  >
                    <Image
                      src={`/assets/ui/avatars/avatar-${p}.png`}
                      alt={`Avatar ${n}`}
                      width={52} height={52}
                      unoptimized
                      className="pixel w-full h-auto"
                    />
                    {active && <div className="absolute inset-0 bg-[rgba(200,146,42,0.15)]" />}
                  </button>
                )
              })}
            </div>

            {saveError && <p className="text-[11px] text-[var(--enemy)]">{saveError}</p>}

            <div className="flex gap-2">
              <Button
                variant="pixelGhost"
                size="md"
                className="flex-shrink-0 px-3"
                onClick={() => setStep('name')}
                disabled={saving}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="pixelGold"
                size="md"
                className="flex-1 font-black tracking-wider"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><Swords className="h-4 w-4" /> Enter the Arena</>
                }
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Button
        variant="pixelGold"
        size="lg"
        className={cn('w-full font-black tracking-wider', className)}
        onClick={handlePlay}
        disabled={isLoading}
      >
        {isLoading
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Connecting…</>
          : <><Swords className="h-5 w-5" /> PLAY NOW</>
        }
      </Button>
    </>
  )
}
