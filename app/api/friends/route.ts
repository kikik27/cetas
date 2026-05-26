// GET /api/friends — list referral relations for current player

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import type { FriendDTO } from '@/src/lib/api-types'

export async function GET(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const [outbound, inbound] = await Promise.all([
      prisma.referral.findMany({
        where:   { referrerId: auth.playerId },
        include: { referred: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.findMany({
        where:   { referredId: auth.playerId },
        include: { referrer: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const friends: FriendDTO[] = [
      ...outbound.map((r) => ({
        id:        r.referred.id,
        name:      r.referred.name,
        avatarIdx: r.referred.avatarIdx,
        joinedAt:  r.createdAt.toISOString(),
        rewarded:  r.rewarded,
        relation:  'outbound' as const,
        claimable: true,
      })),
      ...inbound.map((r) => ({
        id:        r.referrer.id,
        name:      r.referrer.name,
        avatarIdx: r.referrer.avatarIdx,
        joinedAt:  r.createdAt.toISOString(),
        rewarded:  true,
        relation:  'inbound' as const,
        claimable: false,
      })),
    ].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

    return NextResponse.json({ data: friends })
  } catch (err) {
    console.error('[GET /api/friends]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
