'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Users, Copy, Check, Gift, UserPlus, Crown, Ticket, ArrowDownLeft, ArrowUpRight, Loader2, Info } from 'lucide-react'
import { useFriends, useClaimReferralReward, useSubmitReferralCode } from '@/src/hooks/useFriends'
import { useWallet } from '@/src/providers/WalletProvider'
import { Button } from '@/src/components/ui/Button'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { LoadingState } from '@/src/components/ui/LoadingState'
import { cn } from '@/src/lib/utils'
import type { FriendDTO } from '@/src/lib/api-types'

const REFERRAL_REWARD = 100
type FriendFilter = 'all' | 'outbound' | 'inbound'

export default function FriendsClient() {
  const { player, authStatus } = useWallet()
  const isReady = authStatus === 'authenticated'

  const { data: friends = [], isLoading, isFetching }  = useFriends(isReady)
  const claimMutation           = useClaimReferralReward()
  const referralMutation        = useSubmitReferralCode()

  const [copied,     setCopied]     = useState(false)
  const [inputCode,  setInputCode]  = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [filter, setFilter] = useState<FriendFilter>('all')

  const referralCode = player?.referralCode ?? '------'
  const pendingCount = friends.filter(f => f.claimable && !f.rewarded).length
  const claimedCount = friends.filter(f => f.claimable && f.rewarded).length
  const outboundCount = friends.filter(f => f.relation === 'outbound').length
  const inboundCount = friends.filter(f => f.relation === 'inbound').length
  const visibleFriends = friends.filter(friend => filter === 'all' ? true : friend.relation === filter)
  const isInitialLoading = !isReady || isLoading

  // Check if this player already used a referral code
  // (server returns 400 "Already used" if they try again)
  const [usedCode, setUsedCode] = useState<string | null>(null)

  function handleCopy() {
    navigator.clipboard.writeText(referralCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmitCode() {
    if (!inputCode.trim()) return
    try {
      await referralMutation.mutateAsync(inputCode)
      setCodeStatus('success')
      setUsedCode(inputCode.toUpperCase())
      setInputCode('')
    } catch {
      setCodeStatus('error')
    }
    setTimeout(() => setCodeStatus('idle'), 3000)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl
                        border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)]">
          <Image src="/assets/ui/friends.png" alt="" width={18} height={18} loading="eager" unoptimized className="pixel object-contain" aria-hidden />
        </div>
        <h1 className="font-display text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
          Friends & Referral
        </h1>
        <span className="ml-auto font-display text-[11px] text-[var(--text-3)]">
          {isInitialLoading ? 'loading' : isFetching ? 'syncing' : `${friends.length} total`}
        </span>
      </div>

      <div className="game-scroll flex flex-1 flex-col gap-3 overflow-y-auto">
        {/* Invite & Earn card */}
        <section className="relic-frame flex flex-shrink-0 flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[var(--gold-mid)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
              Invite & Earn
            </span>
            <span className="ml-auto rounded-full border border-[var(--border-gold)] bg-[rgba(200,146,42,0.1)]
                             px-2 py-0.5 font-display text-[9px] font-bold text-[var(--gold-mid)]">
              +{REFERRAL_REWARD} XP / friend
            </span>
          </div>
          <div className="divider-gold" />
          <div className="flex items-start gap-2 rounded-xl border border-[rgba(200,146,42,0.24)] bg-[rgba(200,146,42,0.07)] px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--gold-mid)]" />
            <p className="text-[10px] leading-relaxed text-[var(--text-2)]">
              Referral rewards are XP-only for now. In a future update, inviting friends will also unlock CETAS Point rewards.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.6)] py-2.5">
              <span className="font-display text-[20px] font-bold text-[var(--gold-hi)]">{isInitialLoading ? '-' : pendingCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">Pending reward</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.6)] py-2.5">
              <span className="font-display text-[20px] font-bold text-[var(--ok)]">{isInitialLoading ? '-' : claimedCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">Claimed</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[rgba(200,146,42,0.22)] bg-[rgba(200,146,42,0.06)] px-3 py-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--gold-mid)]" />
              <div>
                <p className="font-display text-[11px] font-bold text-[var(--text-1)]">{isInitialLoading ? '-' : outboundCount}</p>
                <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">Invited by me</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[rgba(160,216,255,0.22)] bg-[rgba(160,216,255,0.06)] px-3 py-2">
              <ArrowDownLeft className="h-3.5 w-3.5 text-[var(--ally)]" />
              <div>
                <p className="font-display text-[11px] font-bold text-[var(--text-1)]">{isInitialLoading ? '-' : inboundCount}</p>
                <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">Invited me</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.7)] px-4 py-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">Your code</p>
              <p className="font-mono text-[22px] font-black tracking-[0.25em] text-[var(--gold-hi)]">
                {referralCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 transition-all',
                'font-display text-[9px] font-bold uppercase tracking-wider',
                copied
                  ? 'border-[rgba(61,186,106,0.5)] bg-[rgba(61,186,106,0.12)] text-[var(--ok)]'
                  : 'border-[var(--border-gold)] bg-[rgba(200,146,42,0.1)] text-[var(--gold-hi)] hover:bg-[rgba(200,146,42,0.2)]'
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <Button
            variant="pixelGold"
            size="md"
            className="w-full font-black tracking-wider"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Join me on CETAS!',
                  text: `${player?.name ?? 'A friend'} invites you to play CETAS — the tactical auto-battler on Celo L2. Use my referral code: ${referralCode}`,
                })
              } else {
                handleCopy()
              }
            }}
          >
            <UserPlus className="h-4 w-4" />
            Invite Friends
          </Button>
        </section>

        {/* Enter a referral code */}
        <section className="relic-frame flex flex-shrink-0 flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-[var(--ally)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
              Have a referral code?
            </span>
          </div>

          {usedCode ? (
            <div className="flex items-center gap-2 rounded-xl border border-[rgba(61,186,106,0.3)] bg-[rgba(61,186,106,0.08)] px-3 py-2.5">
              <Check className="h-4 w-4 flex-shrink-0 text-[var(--ok)]" />
              <div>
                <p className="font-display text-[11px] font-bold text-[var(--ok)]">Code applied!</p>
                <p className="text-[9px] text-[var(--text-3)]">
                  Used: <span className="font-mono font-bold">{usedCode}</span>
                  {' '}· referral linked
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => { setInputCode(e.target.value.toUpperCase().slice(0, 8)); setCodeStatus('idle') }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitCode()}
                  placeholder="Enter code e.g. AB12CD"
                  maxLength={8}
                  className={cn(
                    'flex-1 rounded-xl border bg-[rgba(4,16,33,0.7)] px-3 py-2',
                    'font-mono text-[13px] uppercase tracking-widest text-[var(--text-1)]',
                    'placeholder:text-[var(--text-dim)] placeholder:normal-case placeholder:tracking-normal',
                    'outline-none transition-all',
                    codeStatus === 'error'   ? 'border-[rgba(224,48,48,0.6)] focus:border-[var(--enemy)]'
                    : codeStatus === 'success' ? 'border-[rgba(61,186,106,0.6)]'
                                               : 'border-[var(--border)] focus:border-[var(--border-gold)]'
                  )}
                />
                <Button
                  variant="pixelGold"
                  size="sm"
                  onClick={handleSubmitCode}
                  disabled={!inputCode.trim() || referralMutation.isPending}
                  className="px-4 font-black"
                >
                  {referralMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Apply
                </Button>
              </div>
              {codeStatus === 'error' && (
                <p className="text-[10px] text-[var(--enemy)]">
                  Invalid code or already used.
                </p>
              )}
              {codeStatus === 'success' && (
                <p className="text-[10px] text-[var(--ok)]">
                  Code accepted. Your inviter can claim +{REFERRAL_REWARD} XP.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Friends list */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <p className="font-display text-[10px] uppercase tracking-wider text-[var(--text-3)]">
              Referral Network
            </p>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[rgba(4,16,33,0.7)] p-1">
              <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterChip label="Mine" active={filter === 'outbound'} onClick={() => setFilter('outbound')} />
              <FilterChip label="Theirs" active={filter === 'inbound'} onClick={() => setFilter('inbound')} />
            </div>
          </div>
          {isInitialLoading ? (
            <LoadingState label="Loading referrals" className="min-h-[180px]" />
          ) : friends.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No referrals yet"
              description="Invite people or use a code to build your network"
            />
          ) : visibleFriends.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No rows in this tab"
              description="Switch tabs to see the other side of the network"
            />
          ) : (
            visibleFriends.map(friend => (
              <FriendRow
                key={friend.id}
                friend={friend}
                onClaim={() => claimMutation.mutate(friend.id)}
                claiming={claimMutation.isPending && claimMutation.variables === friend.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  label, active, onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-wider transition-all',
        active
          ? 'border border-[rgba(228,200,122,0.65)] bg-[var(--gold-hi)] text-[var(--bg-deep)]'
          : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
      )}
    >
      {label}
    </button>
  )
}

function FriendRow({
  friend, onClaim, claiming,
}: { friend: FriendDTO; onClaim: () => void; claiming: boolean }) {
  const pad      = String(friend.avatarIdx).padStart(2, '0')
  const joinDate = new Date(friend.joinedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const relationLabel = friend.relation === 'outbound' ? 'You invited' : 'Invited you'

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all',
      friend.rewarded
        ? 'border-[rgba(61,186,106,0.2)] bg-[rgba(4,16,33,0.6)] opacity-70'
        : 'border-[var(--border-gold)] bg-[rgba(8,28,58,0.88)]'
    )}>
      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border-2 border-[var(--border-gold)]">
        <Image src={`/assets/ui/avatars/avatar-${pad}.png`} alt={friend.name} width={36} height={36} unoptimized className="pixel h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Crown className="h-2.5 w-2.5 flex-shrink-0 text-[var(--gold-mid)]" />
          <p className="truncate font-display text-[12px] font-bold text-[var(--text-1)]">{friend.name}</p>
        </div>
        <p className="text-[9px] text-[var(--text-3)]">{relationLabel} · {joinDate}</p>
      </div>
      {friend.claimable && friend.rewarded ? (
        <div className="flex items-center gap-1 rounded-lg border border-[rgba(61,186,106,0.3)] bg-[rgba(61,186,106,0.1)] px-2.5 py-1">
          <Check className="h-3 w-3 text-[var(--ok)]" />
          <span className="font-display text-[9px] font-bold uppercase tracking-wider text-[var(--ok)]">Claimed</span>
        </div>
      ) : !friend.claimable ? (
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[rgba(4,16,33,0.6)] px-2.5 py-1">
          <Users className="h-3 w-3 text-[var(--text-3)]" />
          <span className="font-display text-[9px] font-bold uppercase tracking-wider text-[var(--text-3)]">Inbound</span>
        </div>
      ) : (
        <button
          onClick={onClaim}
          disabled={claiming}
          className="flex items-center gap-1 rounded-lg border border-[var(--border-gold)] bg-[rgba(200,146,42,0.14)] px-2.5 py-1 transition-all hover:bg-[rgba(200,146,42,0.24)] disabled:opacity-50"
        >
          <Gift className="h-3 w-3 text-[var(--gold-mid)]" />
          <span className="font-display text-[9px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
            +{REFERRAL_REWARD} XP
          </span>
        </button>
      )}
    </div>
  )
}
