// POST /api/friends/claim — claim referral reward for a friend

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { claimFriendBodySchema, getZodMessage } from '@/src/lib/validation'
import { REFERRAL_XP_REWARD } from '@/src/game/constants'

function levelForExperience(experience: number): number {
  return Math.max(1, Math.floor(experience / 500) + 1)
}

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

    const updatedPlayer = await prisma.$transaction(async tx => {
      const claim = await tx.referral.updateMany({
        where: { id: referral.id, rewarded: false },
        data:  { rewarded: true, rewardedAt: new Date() },
      })
      if (claim.count !== 1) throw new Error('ALREADY_CLAIMED')

      const current = await tx.player.findUniqueOrThrow({
        where: { id: auth.playerId },
        select: { experience: true },
      })
      const nextExperience = current.experience + REFERRAL_XP_REWARD

      return tx.player.update({
        where: { id: auth.playerId },
        data:  {
          experience: { increment: REFERRAL_XP_REWARD },
          level:      { set: levelForExperience(nextExperience) },
        },
        select: { experience: true, level: true },
      })
    })

    return NextResponse.json({
      data: {
        friendId,
        reward: REFERRAL_XP_REWARD,
        experience: updatedPlayer.experience,
        level: updatedPlayer.level,
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }
    console.error('[POST /api/friends/claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
