// GET /api/leaderboard?limit=50&wallet=0x...  — top players + caller's rank

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import type { LeaderboardEntryDTO } from '@/src/lib/api-types'

export async function GET(req: NextRequest) {
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100)
  const wallet = req.nextUrl.searchParams.get('wallet')

  try {
    const entries = await prisma.leaderboardEntry.findMany({
      take:    limit,
      orderBy: { score: 'desc' },
      include: { player: { select: { name: true, avatarIdx: true, walletAddress: true } } },
    })

    const leaderboard: LeaderboardEntryDTO[] = entries.map((e, i) => ({
      rank:      i + 1,
      playerId:  e.playerId,
      name:      e.player.name,
      avatarIdx: e.player.avatarIdx,
      score:     e.score,
      wins:      e.wins,
      streak:    e.streak,
      tier:      e.tier,
    }))

    // Find caller's rank if wallet provided
    let myRank: number | null = null
    if (wallet) {
      const player = await prisma.player.findUnique({
        where: { walletAddress: wallet.toLowerCase() },
        include: { leaderboard: true },
      })
      if (player?.leaderboard) {
        const countAbove = await prisma.leaderboardEntry.count({
          where: { score: { gt: player.leaderboard.score } },
        })
        myRank = countAbove + 1
      }
    }

    return NextResponse.json({ data: { leaderboard, myRank } })
  } catch (err) {
    console.error('[GET /api/leaderboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
