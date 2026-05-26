// GET  /api/friends?wallet=0x...  — list friends (referrals made by this player)
// POST /api/friends/claim         — claim referral reward

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import type { FriendDTO } from '@/src/lib/api-types'

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

    const referrals = await prisma.referral.findMany({
      where:   { referrerId: player.id },
      include: { referred: true },
      orderBy: { createdAt: 'desc' },
    })

    const friends: FriendDTO[] = referrals.map((r) => ({
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
