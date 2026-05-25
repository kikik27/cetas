'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Swords, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/src/components/ui/Button'
import { Modal } from '@/src/components/ui/Modal'
import { useHomeStore } from '@/src/lib/homeStore'
import { cn } from '@/src/lib/utils'

const AVATAR_COUNT = 25
const NAME_MAX     = 16
const SUGGESTED    = ['Commander', 'Warlord', 'Tactician', 'Ironclad', 'Phantom']

type Step = 'name' | 'avatar'

interface Props {
  /** Extra classes forwarded to the outer button wrapper */
  className?: string
}

/**
 * Smart "PLAY NOW" button for the landing page.
 *
 * - Returning user  (isOnboarded = true)  → navigate straight to /home
 * - First-time user (isOnboarded = false) → open 2-step onboarding modal
 *                                           (name → avatar) → navigate to /home
 */
export default function LandingGate({ className }: Props) {
  const router             = useRouter()
  const { isOnboarded, completeOnboarding } = useHomeStore()

  const [open,      setOpen]      = useState(false)
  const [step,      setStep]      = useState<Step>('name')
  const [name,      setName]      = useState('')
  const [avatarIdx, setAvatarIdx] = useState(1)
  const [saving,    setSaving]    = useState(false)

  function handlePlay() {
    if (isOnboarded) {
      router.push('/home')
    } else {
      setStep('name')
      setOpen(true)
    }
  }

  function handleNameNext() {
    setStep('avatar')
  }

  async function handleFinish() {
    setSaving(true)
    completeOnboarding(name.trim() || 'Commander', avatarIdx)
    await new Promise(r => setTimeout(r, 100))
    router.push('/home')
  }

  const pad = String(avatarIdx).padStart(2, '0')

  return (
    <>
      {/* ── Onboarding modal ── */}
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
                {s === 'name' && step === 'avatar'
                  ? <Check className="h-3 w-3" />
                  : i + 1
                }
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
                What shall we call you?
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
                Your name appears on the leaderboard.
              </p>
            </div>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, NAME_MAX))}
              onKeyDown={e => e.key === 'Enter' && handleNameNext()}
              placeholder="Enter your name…"
              maxLength={NAME_MAX}
              autoFocus
              className="w-full rounded-xl border border-[var(--border-gold)]
                         bg-[rgba(200,146,42,0.06)] px-4 py-2.5
                         font-display text-[14px] text-[var(--text-1)]
                         placeholder:text-[var(--text-dim)] outline-none
                         focus:border-[var(--gold-hi)] focus:bg-[rgba(200,146,42,0.1)]
                         transition-all"
            />

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => setName(s)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 font-display text-[9px] font-semibold uppercase tracking-wider transition-all',
                    name === s
                      ? 'border-[var(--gold-mid)] bg-[rgba(200,146,42,0.15)] text-[var(--gold-hi)]'
                      : 'border-[var(--border)] bg-white/[0.03] text-[var(--text-3)] hover:border-[var(--border-gold)] hover:text-[var(--text-2)]'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <Button
              variant="pixelGold"
              size="md"
              className="w-full font-black tracking-wider"
              onClick={handleNameNext}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
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
                You can change this later from your profile.
              </p>
            </div>

            {/* Selected preview */}
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl
                              border-2 border-[var(--gold-mid)]
                              shadow-[0_0_16px_rgba(200,146,42,0.4)]">
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
                  {name.trim() || 'Commander'}
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
                <Swords className="h-4 w-4" />
                {saving ? 'Entering…' : 'Enter the Arena'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── The actual button ── */}
      <Button
        variant="pixelGold"
        size="lg"
        className={cn('w-full font-black tracking-wider', className)}
        onClick={handlePlay}
      >
        <Swords className="h-5 w-5" />
        PLAY NOW
      </Button>
    </>
  )
}
