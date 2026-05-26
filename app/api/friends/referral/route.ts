// POST /api/friends/referral — submit a referral code

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

const REFERRAL_REWARD = 100

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wallet: string; code: string }
    const { wallet, code } = body

    if (!wallet || !code) {
      return NextResponse.json({ error: 'wallet and code required' }, { status: 400 })
    }

    const normalized = code.trim().toUpperCase()

    const [player, referrer] = await Promise.all([
      prisma.player.findUnique({ where: { walletAddress: wallet.toLowerCase() } }),
      prisma.player.findUnique({ where: { referralCode: normalized } }),
    ])

    if (!player)   return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    if (referrer.id === player.id) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 })
    }

    // Check if already used a referral code
    const existingReferral = await prisma.referral.findUnique({
      where: { referredId: player.id },
    })
    if (existingReferral) {
      return NextResponse.json({ error: 'Already used a referral code' }, { status: 400 })
    }

    // Create referral + award points to the new player
    const [, updatedPlayer] = await prisma.$transaction([
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: player.id,
          code:       normalized,
        },
      }),
      prisma.player.update({
        where: { id: player.id },
        data:  { totalPoints: { increment: REFERRAL_REWARD } },
      }),
    ])

    return NextResponse.json({
      data: {
        accepted:    true,
        reward:      REFERRAL_REWARD,
        totalPoints: updatedPlayer.totalPoints,
      },
    })
  } catch (err) {
    console.error('[POST /api/friends/referral]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
