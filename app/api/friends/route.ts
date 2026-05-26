// GET /api/friends — list friends (referrals made by current player)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import type { FriendDTO } from '@/src/lib/api-types'

type ReferralWithReferred = {
  createdAt: Date
  rewarded: boolean
  referred: {
    id: string
    name: string
    avatarIdx: number
  }
}

export async function GET(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const referrals: ReferralWithReferred[] = await prisma.referral.findMany({
      where:   { referrerId: auth.playerId },
      include: { referred: true },
      orderBy: { createdAt: 'desc' },
    })

    const friends: FriendDTO[] = referrals.map((r: ReferralWithReferred) => ({
      id:        r.referred.id,
      name:      r.referred.name,
      avatarIdx: r.referred.avatarIdx,
      joinedAt:  r.createdAt.toISOString(),
      rewarded:  r.rewarded,
    }))

    return NextResponse.json({ data: friends })
  } catch (err) {
    console.error('[GET /api/friends]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
