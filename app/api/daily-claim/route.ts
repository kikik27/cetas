// GET  /api/daily-claim?wallet=0x...  — check today's claim status
// POST /api/daily-claim               — open daily chest

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import type { DailyClaimStatusDTO } from '@/src/lib/api-types'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

const CHEST_REWARDS = [
  { rewardType: 'gold', label: 'Gold Coins', amount: 150 },
  { rewardType: 'xp',   label: 'Battle XP',  amount: 300 },
  { rewardType: 'shard',label: 'Rare Shard', amount: 1   },
  { rewardType: 'gold', label: 'Gold Coins', amount: 80  },
  { rewardType: 'xp',   label: 'Battle XP',  amount: 500 },
  { rewardType: 'shard',label: 'Epic Shard', amount: 1   },
]

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  try {
    const player = await prisma.player.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    })
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const date  = todayKey()
    const claim = await prisma.dailyClaim.findUnique({
      where: { playerId_date: { playerId: player.id, date } },
    })

    const dto: DailyClaimStatusDTO = {
      claimed: !!claim,
      reward:  claim
        ? {
            date:       claim.date,
            rewardType: claim.rewardType,
            amount:     claim.amount,
            label:      claim.label,
            claimedAt:  claim.claimedAt.toISOString(),
          }
        : null,
    }

    return NextResponse.json({ data: dto })
  } catch (err) {
    console.error('[GET /api/daily-claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wallet: string }
    const { wallet } = body

    if (!wallet) {
      return NextResponse.json({ error: 'wallet required' }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    })
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const date = todayKey()

    // Check already claimed
    const existing = await prisma.dailyClaim.findUnique({
      where: { playerId_date: { playerId: player.id, date } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })
    }

    // Pick random reward
    const reward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)]

    // Create claim + award points in transaction
    const [claim, updatedPlayer] = await prisma.$transaction([
      prisma.dailyClaim.create({
        data: {
          playerId:   player.id,
          date,
          rewardType: reward.rewardType,
          amount:     reward.amount,
          label:      reward.label,
        },
      }),
      prisma.player.update({
        where: { id: player.id },
        data:  { totalPoints: { increment: reward.amount } },
      }),
    ])

    return NextResponse.json({
      data: {
        date:        claim.date,
        rewardType:  claim.rewardType,
        amount:      claim.amount,
        label:       claim.label,
        claimedAt:   claim.claimedAt.toISOString(),
        totalPoints: updatedPlayer.totalPoints,
      },
    })
  } catch (err) {
    console.error('[POST /api/daily-claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
