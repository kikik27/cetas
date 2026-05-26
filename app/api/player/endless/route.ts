import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { z } from 'zod'
import { getZodMessage } from '@/src/lib/validation'

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
  maxBoardSlots: z.number().int().min(1).max(12).optional(),
  board: savedBoardSchema.optional(),
  bench: savedBenchSchema.optional(),
}).strict()

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
          maxBoardSlots: parsed.data.maxBoardSlots ?? 3,
          board: parsed.data.board,
          bench: parsed.data.bench,
        }
      : undefined

    await prisma.player.update({
      where: { id: auth.playerId },
      data: {
        endlessStage: { set: parsed.data.stage },
        ...(progress && { gameProgress: progress }),
      },
    })

    const player = await prisma.player.findUnique({
      where: { id: auth.playerId },
      select: { endlessStage: true, gameProgress: true },
    })

    return NextResponse.json({
      data: {
        endlessStage: player?.endlessStage ?? parsed.data.stage,
        gameProgress: player?.gameProgress ?? progress ?? null,
      },
    })
  } catch (err) {
    console.error('[POST /api/player/endless]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
