// POST /api/friends/claim — claim referral reward for a friend

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

const REFERRAL_REWARD = 100

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wallet: string; friendId: string }
    const { wallet, friendId } = body

    if (!wallet || !friendId) {
      return NextResponse.json({ error: 'wallet and friendId required' }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    })
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const referral = await prisma.referral.findFirst({
      where: { referrerId: player.id, referredId: friendId },
    })

    if (!referral)          return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
    if (referral.rewarded)  return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

    const [, updatedPlayer] = await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data:  { rewarded: true, rewardedAt: new Date() },
      }),
      prisma.player.update({
        where: { id: player.id },
        data:  { totalPoints: { increment: REFERRAL_REWARD } },
      }),
    ])

    return NextResponse.json({
      data: {
        friendId,
        reward:      REFERRAL_REWARD,
        totalPoints: updatedPlayer.totalPoints,
      },
    })
  } catch (err) {
    console.error('[POST /api/friends/claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
