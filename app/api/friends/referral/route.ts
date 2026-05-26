// POST /api/friends/referral — submit a referral code

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { referralCodeBodySchema, getZodMessage } from '@/src/lib/validation'

const REFERRAL_REWARD = 100

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = referralCodeBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: getZodMessage(parsed.error) }, { status: 400 })
    }
    // schema already trims + uppercases
    const { code } = parsed.data

    const referrer = await prisma.player.findUnique({ where: { referralCode: code } })
    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }
    if (referrer.id === auth.playerId) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 })
    }

    const existing = await prisma.referral.findUnique({ where: { referredId: auth.playerId } })
    if (existing) {
      return NextResponse.json({ error: 'Already used a referral code' }, { status: 400 })
    }

    const [, updatedPlayer] = await prisma.$transaction([
      prisma.referral.create({
        data: { referrerId: referrer.id, referredId: auth.playerId, code },
      }),
      prisma.player.update({
        where: { id: auth.playerId },
        data:  { totalPoints: { increment: REFERRAL_REWARD } },
      }),
    ])

    return NextResponse.json({
      data: { accepted: true, reward: REFERRAL_REWARD, totalPoints: updatedPlayer.totalPoints },
    })
  } catch (err) {
    console.error('[POST /api/friends/referral]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
