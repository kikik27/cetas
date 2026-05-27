import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { z } from 'zod'
import { getZodMessage } from '@/src/lib/validation'
import {
  INITIAL_BOARD_SLOTS,
  REROLLS_PER_STAGE,
  MAX_BOARD_SLOTS,
  ENDLESS_STAGE_POINT_REWARD,
} from '@/src/game/constants'

const savedUnitSchema = z.object({
  id: z.string().min(1).max(64),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const savedBoardSchema = z.array(
  z.array(savedUnitSchema.nullable()).length(8)
).length(8)

const savedBenchSchema = z.array(savedUnitSchema.nullable()).length(8)

const endlessProgressSchema = z.object({
  stage: z.number().int().min(1).max(10_000),
  hp: z.number().int().min(0).max(100).optional(),
  gold: z.number().int().min(0).max(100).optional(),
  maxBoardSlots: z.number().int().min(1).max(MAX_BOARD_SLOTS).optional(),
  rerollsLeft: z.number().int().min(0).max(REROLLS_PER_STAGE).optional(),
  board: savedBoardSchema.optional(),
  bench: savedBenchSchema.optional(),
}).strict()

function levelForPoints(points: number): number {
  return Math.max(1, Math.floor(points / 500) + 1)
}

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = endlessProgressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: getZodMessage(parsed.error) }, { status: 400 })
    }

    const progress = parsed.data.board && parsed.data.bench
      ? {
          stage: parsed.data.stage,
          hp: parsed.data.hp ?? 100,
          gold: parsed.data.gold ?? 0,
          maxBoardSlots: parsed.data.maxBoardSlots ?? INITIAL_BOARD_SLOTS,
          rerollsLeft: parsed.data.rerollsLeft ?? REROLLS_PER_STAGE,
          board: parsed.data.board,
          bench: parsed.data.bench,
        }
      : undefined

    const current = await prisma.player.findUnique({
      where: { id: auth.playerId },
      select: { bestStage: true, totalPoints: true },
    })
    if (!current) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const previousBest = current.bestStage
    const nextBest = Math.max(previousBest, parsed.data.stage)
    const newlyClearedStages = Math.max(0, nextBest - previousBest)
    const stagePointReward = newlyClearedStages * ENDLESS_STAGE_POINT_REWARD
    const nextTotalPoints = current.totalPoints + stagePointReward

    await prisma.player.update({
      where: { id: auth.playerId },
      data: {
        endlessStage: { set: parsed.data.stage },
        bestStage: { set: nextBest },
        ...(stagePointReward > 0 && {
          totalPoints: { increment: stagePointReward },
          level: { set: levelForPoints(nextTotalPoints) },
        }),
        ...(progress && { gameProgress: progress }),
      },
    })

    const player = await prisma.player.findUnique({
      where: { id: auth.playerId },
      select: { endlessStage: true, bestStage: true, gameProgress: true, totalPoints: true, level: true },
    })

    return NextResponse.json({
      data: {
        endlessStage: player?.endlessStage ?? parsed.data.stage,
        bestStage: player?.bestStage ?? nextBest,
        gameProgress: player?.gameProgress ?? progress ?? null,
        totalPoints: player?.totalPoints ?? nextTotalPoints,
        level: player?.level ?? levelForPoints(nextTotalPoints),
        pointsAwarded: stagePointReward,
      },
    })
  } catch (err) {
    console.error('[POST /api/player/endless]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
