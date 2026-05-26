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
  rankScore: number
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
    const players = await prisma.$queryRaw<PlayerRankRecord[]>`
      SELECT
        "id",
        "name",
        "avatar_idx" AS "avatarIdx",
        "total_points" AS "totalPoints",
        "streak_days" AS "streakDays",
        "endless_stage" AS "endlessStage",
        ("total_points" + (GREATEST("endless_stage" - 1, 0) * 100)) AS "rankScore"
      FROM "players"
      ORDER BY "rankScore" DESC, "streak_days" DESC, "endless_stage" DESC, "created_at" ASC
      LIMIT ${limit}
    `

    const leaderboard: LeaderboardEntryDTO[] = players.map((p: PlayerRankRecord, i: number) => ({
      rank:      i + 1,
      playerId:  p.id,
      name:      p.name,
      avatarIdx: p.avatarIdx,
      score:     p.totalPoints,
      wins:      Math.max(0, p.endlessStage - 1),
      streak:    p.streakDays,
      tier:      getTier(p.rankScore),
    }))

    let myRank: number | null = null
    if (auth) {
      const me = await prisma.player.findUnique({
        where: { id: auth.playerId },
        select: { totalPoints: true, streakDays: true, endlessStage: true, createdAt: true },
      })
      if (me) {
        const myScore = me.totalPoints + Math.max(0, me.endlessStage - 1) * 100
        const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*)::bigint AS "count"
          FROM "players"
          WHERE
            ("total_points" + (GREATEST("endless_stage" - 1, 0) * 100)) > ${myScore}
            OR (
              ("total_points" + (GREATEST("endless_stage" - 1, 0) * 100)) = ${myScore}
              AND "streak_days" > ${me.streakDays}
            )
            OR (
              ("total_points" + (GREATEST("endless_stage" - 1, 0) * 100)) = ${myScore}
              AND "streak_days" = ${me.streakDays}
              AND "endless_stage" > ${me.endlessStage}
            )
            OR (
              ("total_points" + (GREATEST("endless_stage" - 1, 0) * 100)) = ${myScore}
              AND "streak_days" = ${me.streakDays}
              AND "endless_stage" = ${me.endlessStage}
              AND "created_at" < ${me.createdAt}
            )
        `
        myRank = Number(countRows[0]?.count ?? 0) + 1
      }
    }

    return NextResponse.json(
      { data: { leaderboard, myRank } },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[GET /api/leaderboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
