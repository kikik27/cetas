// GET /api/leaderboard?limit=50 — top players + caller's rank

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { resolveAuth } from '@/src/lib/api-auth'
import type { LeaderboardEntryDTO } from '@/src/lib/api-types'

type LeaderboardEntryWithPlayer = {
  playerId: string
  score: number
  wins: number
  streak: number
  tier: string
  player: {
    name: string
    avatarIdx: number
  }
}

export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100)

  // Leaderboard is public — auth is optional (only needed for myRank)
  const auth = await resolveAuth(req)

  try {
    const entries: LeaderboardEntryWithPlayer[] = await prisma.leaderboardEntry.findMany({
      take:    limit,
      orderBy: { score: 'desc' },
      include: { player: { select: { name: true, avatarIdx: true } } },
    })

    const leaderboard: LeaderboardEntryDTO[] = entries.map((e: LeaderboardEntryWithPlayer, i: number) => ({
      rank:      i + 1,
      playerId:  e.playerId,
      name:      e.player.name,
      avatarIdx: e.player.avatarIdx,
      score:     e.score,
      wins:      e.wins,
      streak:    e.streak,
      tier:      e.tier,
    }))

    let myRank: number | null = null
    if (auth) {
      const myEntry = await prisma.leaderboardEntry.findUnique({
        where: { playerId: auth.playerId },
      })
      if (myEntry) {
        const countAbove = await prisma.leaderboardEntry.count({
          where: { score: { gt: myEntry.score } },
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
