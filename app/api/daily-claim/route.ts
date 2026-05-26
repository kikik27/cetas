// GET  /api/daily-claim  — check today's claim status
// POST /api/daily-claim  — open daily chest

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import type { DailyClaimStatusDTO } from '@/src/lib/api-types'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

const CHEST_REWARDS = [
  { rewardType: 'xp', label: 'Battle XP',  amount: 150 },
  { rewardType: 'xp', label: 'Battle XP',  amount: 300 },
  { rewardType: 'xp', label: 'Battle XP',  amount: 80  },
  { rewardType: 'xp', label: 'Battle XP',  amount: 500 },
  { rewardType: 'xp', label: 'Battle XP',  amount: 200 },
  { rewardType: 'xp', label: 'Battle XP',  amount: 250 },
]

export async function GET(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const date  = todayKey()
    const claim = await prisma.dailyClaim.findUnique({
      where: { playerId_date: { playerId: auth.playerId, date } },
    })

    const dto: DailyClaimStatusDTO = {
      claimed: !!claim,
      reward:  claim ? {
        date:       claim.date,
        rewardType: claim.rewardType as 'xp',
        amount:     claim.amount,
        label:      claim.label,
        claimedAt:  claim.claimedAt.toISOString(),
      } : null,
    }

    return NextResponse.json({ data: dto })
  } catch (err) {
    console.error('[GET /api/daily-claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const date = todayKey()

    const existing = await prisma.dailyClaim.findUnique({
      where: { playerId_date: { playerId: auth.playerId, date } },
    })
    if (existing) return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })

    const reward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)]

    const [claim, updatedPlayer] = await prisma.$transaction([
      prisma.dailyClaim.create({
        data: { playerId: auth.playerId, date, ...reward },
      }),
      prisma.player.update({
        where: { id: auth.playerId },
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
