'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Coins,
  Gem,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
} from 'lucide-react'
import { Button } from '@/src/components/ui/Button'
import { LoadingRows } from '@/src/components/ui/LoadingState'
import { syncPlayerQuery, usePlayer } from '@/src/hooks/usePlayer'
import { useWallet } from '@/src/providers/WalletProvider'
import { cn } from '@/src/lib/utils'
import BottomNav from './home/BottomNav'

type RedeemStatus = 'pending' | 'mocked' | 'confirmed' | 'failed'

type RedeemHistoryItem = {
  id: string
  points: number
  celo: number
  status: RedeemStatus
  createdAt: string
}

type RedeemQuote = {
  totalPoints: number | null
  rate: number
  rateLabel: string
  mock: boolean
  minPoints: number
  maxPoints: number
  dailyLimit: number
  redeemedToday: number
  history: RedeemHistoryItem[]
}

const FALLBACK_QUOTE: RedeemQuote = {
  totalPoints: null,
  rate: 0.00025,
  rateLabel: '1 pt = 0.00025 CELO',
  mock: true,
  minPoints: 100,
  maxPoints: 5000,
  dailyLimit: 5000,
  redeemedToday: 0,
  history: [
    {
      id: 'mock-1',
      points: 750,
      celo: 0.1875,
      status: 'mocked',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'mock-2',
      points: 300,
      celo: 0.075,
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
  ],
}

const QUICK_PRESETS = [250, 500, 1000, 2500]

function formatPoints(value: number) {
  return value.toLocaleString('en-US')
}

function formatCelo(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  })
}

function parseRateLabel(rateLabel: string | undefined) {
  if (!rateLabel) return FALLBACK_QUOTE.rate

  const [pointsPart, celoPart] = rateLabel.split('=')
  const points = Number.parseFloat(pointsPart?.replace(/[^0-9.]/g, '') ?? '')
  const celo = Number.parseFloat(celoPart?.replace(/[^0-9.]/g, '') ?? '')

  return points > 0 && celo > 0 ? celo / points : FALLBACK_QUOTE.rate
}

function normalizeHistoryItem(item: Partial<RedeemHistoryItem> & { celoAmount?: string }): RedeemHistoryItem {
  const parsedCelo = Number.parseFloat(item.celoAmount ?? '0') || 0

  return {
    id: item.id ?? crypto.randomUUID(),
    points: item.points ?? 0,
    celo: item.celo ?? parsedCelo,
    status: item.status ?? 'mocked',
    createdAt: item.createdAt ?? new Date().toISOString(),
  }
}

function normalizeQuote(payload: unknown): RedeemQuote {
  const envelope = payload as { data?: Record<string, unknown> }
  const data = (envelope?.data ?? payload) as Partial<RedeemQuote> & {
    totalPoints?: number
    rateLabel?: string
    mock?: boolean
    history?: Array<Partial<RedeemHistoryItem> & { celoAmount?: string }>
  }
  const rateLabel = data.rateLabel ?? FALLBACK_QUOTE.rateLabel

  return {
    ...FALLBACK_QUOTE,
    totalPoints: typeof data.totalPoints === 'number' ? data.totalPoints : FALLBACK_QUOTE.totalPoints,
    rate: typeof data.rate === 'number' ? data.rate : parseRateLabel(rateLabel),
    rateLabel,
    mock: data.mock ?? FALLBACK_QUOTE.mock,
    minPoints: data.minPoints ?? FALLBACK_QUOTE.minPoints,
    maxPoints: data.maxPoints ?? data.totalPoints ?? FALLBACK_QUOTE.maxPoints,
    dailyLimit: data.dailyLimit ?? FALLBACK_QUOTE.dailyLimit,
    redeemedToday: data.redeemedToday ?? FALLBACK_QUOTE.redeemedToday,
    history: data.history?.map(normalizeHistoryItem) ?? [],
  }
}

export default function RedeemClient() {
  const queryClient = useQueryClient()
  const { authStatus, player: walletPlayer } = useWallet()
  const { data: queryPlayer, isLoading: playerLoading } = usePlayer(authStatus === 'authenticated')
  const player = queryPlayer ?? walletPlayer

  const [quote, setQuote] = useState<RedeemQuote>(FALLBACK_QUOTE)
  const [quoteState, setQuoteState] = useState<'loading' | 'mock' | 'live'>('loading')
  const [amount, setAmount] = useState('500')
  const [redeeming, setRedeeming] = useState(false)
  const [localHistory, setLocalHistory] = useState<RedeemHistoryItem[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const pointsBalance = quote.totalPoints ?? player?.totalPoints ?? 0

  useEffect(() => {
    let alive = true

    async function loadQuote() {
      if (authStatus !== 'authenticated') {
        setQuoteState('mock')
        return
      }

      setQuoteState('loading')
      try {
        const res = await fetch('/api/redeem', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error('Redeem quote unavailable')
        const payload = await res.json() as unknown

        if (!alive) return
        setQuote(normalizeQuote(payload))
        setQuoteState('live')
      } catch {
        if (!alive) return
        setQuote(FALLBACK_QUOTE)
        setQuoteState('mock')
      }
    }

    loadQuote()
    return () => { alive = false }
  }, [authStatus, refreshNonce])

  const parsedAmount = Math.max(0, Number.parseInt(amount.replace(/\D/g, ''), 10) || 0)
  const estimate = useMemo(() => parsedAmount * quote.rate, [parsedAmount, quote.rate])
  const dailyRemaining = Math.max(0, quote.dailyLimit - quote.redeemedToday)
  const clampedMax = Math.min(pointsBalance || quote.maxPoints, quote.maxPoints, dailyRemaining || quote.maxPoints)
  const progressPct = quote.dailyLimit > 0
    ? Math.min(100, Math.round((quote.redeemedToday / quote.dailyLimit) * 100))
    : 0

  const validationMessage =
    authStatus !== 'authenticated' ? 'Connect your wallet to prepare a redeem request.'
    : parsedAmount < quote.minPoints ? `Minimum redeem is ${formatPoints(quote.minPoints)} pts.`
    : pointsBalance > 0 && parsedAmount > pointsBalance ? 'You do not have enough points.'
    : parsedAmount > quote.maxPoints ? `Single redeem cap is ${formatPoints(quote.maxPoints)} pts.`
    : dailyRemaining > 0 && parsedAmount > dailyRemaining ? 'This exceeds the mock daily limit.'
    : null

  const canRedeem = !validationMessage && parsedAmount > 0 && !redeeming
  const history = [...localHistory, ...quote.history]

  async function handleRedeem() {
    if (!canRedeem) return

    setRedeeming(true)
    setToast(null)

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ points: parsedAmount }),
      })

      if (!res.ok) throw new Error('Mock redeem queued locally')
      const payload = await res.json() as {
        data?: {
          totalPoints?: number
          redemption?: Partial<RedeemHistoryItem> & { celoAmount?: string }
        }
      }
      const redemption = payload.data?.redemption ?? payload.data ?? {}

      if (typeof payload.data?.totalPoints === 'number') {
        setQuote(prev => ({ ...prev, totalPoints: payload.data?.totalPoints ?? prev.totalPoints }))
        await syncPlayerQuery(queryClient, { totalPoints: payload.data.totalPoints })
      }
      setLocalHistory(prev => [normalizeHistoryItem({
        points: parsedAmount,
        celo: estimate,
        status: 'pending',
        ...redemption,
      }), ...prev])
      setToast('Redeem request queued for contract settlement.')
    } catch {
      setLocalHistory(prev => [{
        id: crypto.randomUUID(),
        points: parsedAmount,
        celo: estimate,
        status: 'mocked',
        createdAt: new Date().toISOString(),
      }, ...prev])
      setToast('Mock redeem recorded locally until /api/redeem is ready.')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-shrink-0 items-center gap-2 px-1">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(200,146,42,0.3)] bg-[rgba(200,146,42,0.08)]">
          <Image
            src="/assets/celo/logo-symbol.png"
            alt=""
            width={18}
            height={18}
            loading="eager"
            unoptimized
            className="object-contain"
            aria-hidden
          />
        </div>
        <div>
          <h1 className="font-display text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--gold-hi)]">
            Redeem Vault
          </h1>
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">
            Points to CELO
          </p>
        </div>
        <span className={cn(
          'ml-auto rounded-full border px-2 py-1 font-display text-[8px] font-bold uppercase tracking-wider',
          quoteState === 'live'
            ? 'border-[rgba(61,186,106,0.35)] bg-[rgba(61,186,106,0.1)] text-[var(--ok)]'
            : 'border-[rgba(224,128,32,0.35)] bg-[rgba(224,128,32,0.1)] text-[var(--warn)]'
        )}>
          {quoteState === 'loading' ? 'Syncing' : quoteState === 'live' ? 'Live quote' : 'Mock mode'}
        </span>
      </div>

      <div className="game-scroll flex flex-1 flex-col gap-3 overflow-y-auto">
        <section className="relic-frame overflow-hidden px-4 py-4">
          <div className="relative z-[1] flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-gold)] bg-[rgba(200,146,42,0.1)] shadow-[0_0_24px_rgba(200,146,42,0.12)]">
              <Sparkles className="h-5 w-5 text-[var(--gold-hi)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-mid)]">
                Contract not armed yet
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
                This screen previews the redeem flow. Requests are mock records until the CETAS redeem contract is deployed.
              </p>
            </div>
          </div>
        </section>

        <section className="grid flex-shrink-0 grid-cols-2 gap-2">
          <StatTile
            icon={<Coins className="h-4 w-4 text-[var(--gold-hi)]" />}
            label="Points"
            value={playerLoading && !player ? '...' : formatPoints(pointsBalance)}
          />
          <StatTile
            icon={<Gem className="h-4 w-4 text-[#8fffe0]" />}
            label="Est. CELO"
            value={formatCelo(estimate)}
          />
        </section>

        <section className="relic-frame flex flex-col gap-3 px-4 py-4">
          <div className="relative z-[1] flex items-center gap-2">
            <Ticket className="h-4 w-4 text-[var(--gold-mid)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--gold-hi)]">
              Redeem Amount
            </span>
            <span className="ml-auto text-[9px] uppercase tracking-wider text-[var(--text-3)]">
              {quote.rateLabel}
            </span>
          </div>

          <div className="relative z-[1] rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.78)] px-3 py-3">
            <label htmlFor="redeem-points" className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">
              Points to redeem
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="redeem-points"
                inputMode="numeric"
                value={amount}
                onChange={event => setAmount(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="min-w-0 flex-1 bg-transparent font-display text-[30px] font-black leading-none tabular-nums text-[var(--gold-hi)] outline-none"
                aria-describedby="redeem-validation"
              />
              <button
                type="button"
                onClick={() => setAmount(String(Math.max(quote.minPoints, clampedMax)))}
                className="rounded-lg border border-[rgba(200,146,42,0.35)] bg-[rgba(200,146,42,0.1)] px-2.5 py-1.5 font-display text-[9px] font-bold uppercase tracking-wider text-[var(--gold-hi)] active:scale-95"
              >
                Max
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {QUICK_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(Math.min(preset, quote.maxPoints)))}
                  className={cn(
                    'rounded-lg border px-2 py-1.5 font-display text-[9px] font-bold tabular-nums transition-all active:scale-95',
                    parsedAmount === preset
                      ? 'border-[var(--gold-hi)] bg-[var(--gold-hi)] text-[var(--bg-deep)]'
                      : 'border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-2)]'
                  )}
                >
                  {formatPoints(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-[1] grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <MiniQuote label="Spend" value={`${formatPoints(parsedAmount)} pts`} />
            <ChevronRight className="h-4 w-4 text-[var(--gold-mid)]" />
            <MiniQuote label="Receive" value={`${formatCelo(estimate)} CELO`} accent />
          </div>

          <div className="relative z-[1]">
            <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-[var(--text-3)]">
              <span>Mock daily limit</span>
              <span>{formatPoints(quote.redeemedToday)} / {formatPoints(quote.dailyLimit)}</span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill bg-gradient-to-r from-[var(--ally)] to-[#8fffe0]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {validationMessage && (
            <p id="redeem-validation" className="relative z-[1] flex items-center gap-1.5 text-[10px] text-[var(--warn)]">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {validationMessage}
            </p>
          )}

          {toast && (
            <p className="relative z-[1] flex items-center gap-1.5 rounded-lg border border-[rgba(61,186,106,0.25)] bg-[rgba(61,186,106,0.08)] px-3 py-2 text-[10px] text-[var(--ok)]">
              <Check className="h-3 w-3 flex-shrink-0" />
              {toast}
            </p>
          )}

          <Button
            variant="pixelGold"
            size="lg"
            onClick={handleRedeem}
            disabled={!canRedeem}
            className="relative z-[1] w-full font-display text-[12px] font-black uppercase tracking-[0.16em]"
          >
            {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Queue Mock Redeem
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--ally)]" />
            <p className="font-display text-[10px] uppercase tracking-wider text-[var(--text-3)]">
              Redeem History
            </p>
            <button
              type="button"
              onClick={() => setRefreshNonce(n => n + 1)}
              className="ml-auto rounded-lg p-1.5 text-[var(--text-3)] active:scale-95"
              aria-label="Refresh redeem history"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {quoteState === 'loading' ? (
            <LoadingRows count={3} />
          ) : history.length === 0 ? (
            <div className="relic-frame flex flex-col items-center gap-2 py-8 text-center">
              <Wallet className="h-8 w-8 text-[var(--text-dim)]" />
              <p className="font-display text-[12px] text-[var(--text-3)]">No redeem requests yet</p>
              <p className="text-[10px] text-[var(--text-dim)]">Queue a mock redeem to preview the flow.</p>
            </div>
          ) : (
            history.map(item => <HistoryRow key={item.id} item={item} />)
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  )
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="relic-frame flex items-center gap-3 px-3 py-3">
      <div className="relative z-[1] flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.7)]">
        {icon}
      </div>
      <div className="relative z-[1] min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-[var(--text-3)]">{label}</p>
        <p className="truncate font-display text-[15px] font-bold tabular-nums text-[var(--text-1)]">{value}</p>
      </div>
    </div>
  )
}

function MiniQuote({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.65)] px-3 py-2 text-center">
      <p className="text-[8px] uppercase tracking-wider text-[var(--text-3)]">{label}</p>
      <p className={cn(
        'mt-0.5 font-display text-[12px] font-bold tabular-nums',
        accent ? 'text-[#8fffe0]' : 'text-[var(--text-1)]'
      )}>
        {value}
      </p>
    </div>
  )
}

function HistoryRow({ item }: { item: RedeemHistoryItem }) {
  const statusStyle = {
    pending: 'border-[rgba(224,128,32,0.35)] bg-[rgba(224,128,32,0.1)] text-[var(--warn)]',
    mocked: 'border-[rgba(160,216,255,0.28)] bg-[rgba(160,216,255,0.08)] text-[var(--ally)]',
    confirmed: 'border-[rgba(61,186,106,0.35)] bg-[rgba(61,186,106,0.1)] text-[var(--ok)]',
    failed: 'border-[rgba(224,48,48,0.35)] bg-[rgba(224,48,48,0.1)] text-[var(--enemy)]',
  }[item.status]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.72)] px-3 py-2.5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(200,146,42,0.25)] bg-[rgba(200,146,42,0.08)]">
        <Gem className="h-4 w-4 text-[#8fffe0]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[12px] font-bold text-[var(--text-1)]">
          {formatPoints(item.points)} pts {'->'} {formatCelo(item.celo)} CELO
        </p>
        <p className="text-[9px] text-[var(--text-3)]">
          {new Date(item.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <span className={cn('rounded-md border px-2 py-1 font-display text-[8px] font-bold uppercase tracking-wider', statusStyle)}>
        {item.status}
      </span>
    </div>
  )
}
