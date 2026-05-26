// POST /api/friends/claim — claim referral reward for a friend

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { claimFriendBodySchema, getZodMessage } from '@/src/lib/validation'

const REFERRAL_REWARD = 100

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = claimFriendBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: getZodMessage(parsed.error) }, { status: 400 })
    }
    const { friendId } = parsed.data

    const referral = await prisma.referral.findFirst({
      where: { referrerId: auth.playerId, referredId: friendId },
    })

    if (!referral)         return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
    if (referral.rewarded) return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

    const [, updatedPlayer] = await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data:  { rewarded: true, rewardedAt: new Date() },
      }),
      prisma.player.update({
        where: { id: auth.playerId },
        data:  { totalPoints: { increment: REFERRAL_REWARD } },
      }),
    ])

    return NextResponse.json({
      data: { friendId, reward: REFERRAL_REWARD, totalPoints: updatedPlayer.totalPoints },
    })
  } catch (err) {
    console.error('[POST /api/friends/claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
