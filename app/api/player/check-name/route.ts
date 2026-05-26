/**
 * GET /api/player/check-name?name=xxx
 *
 * Public endpoint — checks if a player name is available.
 * Used for real-time availability feedback during onboarding and rename.
 *
 * Returns:
 *   { data: { available: boolean, name: string } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { playerNameSchema, getZodMessage } from '@/src/lib/validation'

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('name') ?? ''

  // Validate name format first
  const parsed = playerNameSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { data: { available: false, name: raw, reason: getZodMessage(parsed.error) } },
      { status: 200 }  // 200 so client can show inline error, not a hard failure
    )
  }

  const name = parsed.data

  try {
    const existing = await prisma.player.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    })

    return NextResponse.json({
      data: { available: !existing, name },
    })
  } catch (err) {
    console.error('[GET /api/player/check-name]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
