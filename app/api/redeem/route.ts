import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { getZodMessage, redeemPointsBodySchema } from '@/src/lib/validation'
import type { PointRedemptionDTO, RedeemSummaryDTO } from '@/src/lib/api-types'

const MIN_REDEEM_POINTS = 100
const CELO_MICRO_PER_POINT = 100 // mock rate: 1,000 pts = 0.1 CELO
const RATE_LABEL = '1,000 pts = 0.1 CELO'

function toCeloAmount(points: number): string {
  const micro = points * CELO_MICRO_PER_POINT
  const whole = Math.floor(micro / 1_000_000)
  const fraction = String(micro % 1_000_000).padStart(6, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : String(whole)
}

function toRedemptionDTO(row: {
  id: string
  points: number
  celoAmount: string
  status: string
  txHash: string | null
  createdAt: Date
}): PointRedemptionDTO {
  return {
    id:         row.id,
    points:     row.points,
    celoAmount: row.celoAmount,
    status:     ['mocked', 'pending', 'confirmed', 'failed'].includes(row.status)
      ? row.status as PointRedemptionDTO['status']
      : 'mocked',
    txHash:     row.txHash,
    createdAt:  row.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const [player, history] = await Promise.all([
      prisma.player.findUnique({
        where:  { id: auth.playerId },
        select: { totalPoints: true },
      }),
      prisma.pointRedemption.findMany({
        where:   { playerId: auth.playerId },
        orderBy: { createdAt: 'desc' },
        take:    10,
      }),
    ])

    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const dto: RedeemSummaryDTO = {
      totalPoints: player.totalPoints,
      minPoints:   MIN_REDEEM_POINTS,
      maxPoints:   player.totalPoints,
      rateLabel:   RATE_LABEL,
      mock:        true,
      history:     history.map(toRedemptionDTO),
    }

    return NextResponse.json({ data: dto })
  } catch (err) {
    console.error('[GET /api/redeem]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = redeemPointsBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: getZodMessage(parsed.error) }, { status: 400 })
    }

    const { points } = parsed.data
    const celoAmount = toCeloAmount(points)

    const [updated, redemption] = await prisma.$transaction(async tx => {
      const update = await tx.player.updateMany({
        where: { id: auth.playerId, totalPoints: { gte: points } },
        data:  { totalPoints: { decrement: points } },
      })

      if (update.count === 0) {
        throw new Error('INSUFFICIENT_POINTS')
      }

      const created = await tx.pointRedemption.create({
        data: {
          playerId: auth.playerId,
          points,
          celoAmount,
          status: 'mocked',
        },
      })

      const player = await tx.player.findUnique({
        where:  { id: auth.playerId },
        select: { totalPoints: true },
      })

      if (!player) throw new Error('PLAYER_NOT_FOUND')
      return [player, created] as const
    })

    return NextResponse.json({
      data: {
        totalPoints: updated.totalPoints,
        redemption:  toRedemptionDTO(redemption),
        mock:        true,
        rateLabel:   RATE_LABEL,
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json({ error: 'Not enough points to redeem.' }, { status: 400 })
    }

    console.error('[POST /api/redeem]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
