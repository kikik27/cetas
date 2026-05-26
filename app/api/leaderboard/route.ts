// GET /api/leaderboard?limit=50 — top players + caller's rank

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { resolveAuth } from '@/src/lib/api-auth'
import type { LeaderboardEntryDTO } from '@/src/lib/api-types'

type PlayerRankRecord = {
  id: string
  name: string
  avatarIdx: number
  totalPoints: number
  streakDays: number
  endlessStage: number
}

function getTier(score: number): string {
  if (score >= 100_000) return 'Mythic'
  if (score >= 50_000) return 'Grandmaster'
  if (score >= 20_000) return 'Diamond'
  if (score >= 10_000) return 'Platinum'
  if (score >= 5_000) return 'Gold'
  return 'Bronze'
}

export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100)

  // Leaderboard is public — auth is optional (only needed for myRank)
  const auth = await resolveAuth(req)

  try {
    const players: PlayerRankRecord[] = await prisma.player.findMany({
      take:    limit,
      orderBy: [
        { totalPoints: 'desc' },
        { streakDays: 'desc' },
        { endlessStage: 'desc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        avatarIdx: true,
        totalPoints: true,
        streakDays: true,
        endlessStage: true,
      },
    })

    const leaderboard: LeaderboardEntryDTO[] = players.map((p: PlayerRankRecord, i: number) => ({
      rank:      i + 1,
      playerId:  p.id,
      name:      p.name,
      avatarIdx: p.avatarIdx,
      score:     p.totalPoints,
      wins:      Math.max(0, p.endlessStage - 1),
      streak:    p.streakDays,
      tier:      getTier(p.totalPoints),
    }))

    let myRank: number | null = null
    if (auth) {
      const me = await prisma.player.findUnique({
        where: { id: auth.playerId },
        select: { totalPoints: true, streakDays: true, endlessStage: true, createdAt: true },
      })
      if (me) {
        const countAbove = await prisma.player.count({
          where: {
            OR: [
              { totalPoints: { gt: me.totalPoints } },
              {
                totalPoints: me.totalPoints,
                streakDays: { gt: me.streakDays },
              },
              {
                totalPoints: me.totalPoints,
                streakDays: me.streakDays,
                endlessStage: { gt: me.endlessStage },
              },
              {
                totalPoints: me.totalPoints,
                streakDays: me.streakDays,
                endlessStage: me.endlessStage,
                createdAt: { lt: me.createdAt },
              },
            ],
          },
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
