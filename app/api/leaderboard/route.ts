// GET /api/leaderboard?limit=50 — top players + caller's rank

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { resolveAuth } from '@/src/lib/api-auth'
import type { LeaderboardEntryDTO } from '@/src/lib/api-types'
import { ENDLESS_STAGE_RANK_WEIGHT } from '@/src/game/constants'

type PlayerRankRecord = {
  id: string
  name: string
  avatarIdx: number
  experience: number
  level: number
  streakDays: number
  bestStage: number
  rankScore: number
}

function getTier(score: number): string {
  if (score >= 80_000) return 'Mythic'
  if (score >= 45_000) return 'Grandmaster'
  if (score >= 24_000) return 'Diamond'
  if (score >= 12_000) return 'Platinum'
  if (score >= 5_000) return 'Gold'
  return 'Bronze'
}

export async function GET(req: NextRequest) {
  const rawLimit = Number.parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 100))
    : 50

  // Leaderboard is public — auth is optional (only needed for myRank)
  const auth = await resolveAuth(req)

  try {
    const players = await prisma.$queryRaw<PlayerRankRecord[]>`
      SELECT
        "id",
        "name",
        "avatar_idx" AS "avatarIdx",
        "experience",
        "level",
        "streak_days" AS "streakDays",
        "best_stage" AS "bestStage",
        (
          (GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT})
          + "experience"
          + (GREATEST("level" - 1, 0) * 250)
          + ("streak_days" * 50)
        ) AS "rankScore"
      FROM "players"
      ORDER BY "rankScore" DESC, "best_stage" DESC, "level" DESC, "experience" DESC, "streak_days" DESC, "created_at" ASC
      LIMIT ${limit}
    `

    const leaderboard: LeaderboardEntryDTO[] = players.map((p, i: number) => ({
      rank:      i + 1,
      playerId:  p.id,
      name:      p.name,
      avatarIdx: p.avatarIdx,
      score:     p.rankScore,
      points:    0,
      experience: p.experience,
      level:     p.level,
      bestStage: p.bestStage,
      wins:      Math.max(0, p.bestStage - 1),
      streak:    p.streakDays,
      tier:      getTier(p.rankScore),
    }))

    let myRank: number | null = null
    if (auth) {
      const me = await prisma.player.findUnique({
        where: { id: auth.playerId },
        select: { experience: true, level: true, streakDays: true, bestStage: true, createdAt: true },
      })
      if (me) {
        const myScore =
          Math.max(0, me.bestStage - 1) * ENDLESS_STAGE_RANK_WEIGHT +
          me.experience +
          Math.max(0, me.level - 1) * 250 +
          me.streakDays * 50
        const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*)::bigint AS "count"
          FROM "players"
          WHERE
            ((GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT}) + "experience" + (GREATEST("level" - 1, 0) * 250) + ("streak_days" * 50)) > ${myScore}
            OR (
              ((GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT}) + "experience" + (GREATEST("level" - 1, 0) * 250) + ("streak_days" * 50)) = ${myScore}
              AND "best_stage" > ${me.bestStage}
            )
            OR (
              ((GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT}) + "experience" + (GREATEST("level" - 1, 0) * 250) + ("streak_days" * 50)) = ${myScore}
              AND "best_stage" = ${me.bestStage}
              AND "level" > ${me.level}
            )
            OR (
              ((GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT}) + "experience" + (GREATEST("level" - 1, 0) * 250) + ("streak_days" * 50)) = ${myScore}
              AND "best_stage" = ${me.bestStage}
              AND "level" = ${me.level}
              AND "experience" > ${me.experience}
            )
            OR (
              ((GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT}) + "experience" + (GREATEST("level" - 1, 0) * 250) + ("streak_days" * 50)) = ${myScore}
              AND "best_stage" = ${me.bestStage}
              AND "level" = ${me.level}
              AND "experience" = ${me.experience}
              AND "streak_days" > ${me.streakDays}
            )
            OR (
              ((GREATEST("best_stage" - 1, 0) * ${ENDLESS_STAGE_RANK_WEIGHT}) + "experience" + (GREATEST("level" - 1, 0) * 250) + ("streak_days" * 50)) = ${myScore}
              AND "best_stage" = ${me.bestStage}
              AND "level" = ${me.level}
              AND "experience" = ${me.experience}
              AND "streak_days" = ${me.streakDays}
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
