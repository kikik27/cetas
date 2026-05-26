/**
 * GET /api/auth/me — return current session player profile
 * Used on app mount to restore session without re-login
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/src/lib/session'
import { prisma } from '@/src/lib/db'
import type { PlayerDTO } from '@/src/lib/api-types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const player = session.playerId
      ? await prisma.player.findUnique({ where: { id: session.playerId } })
      : await prisma.player.findUnique({ where: { walletAddress: session.walletAddress } })
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const dto: PlayerDTO = {
      id:              player.id,
      walletAddress:   player.walletAddress,
      name:            player.name,
      avatarIdx:       player.avatarIdx,
      totalPoints:     player.totalPoints,
      level:           player.level,
      streakDays:      player.streakDays,
      referralCode:    player.referralCode,
      lastLoginAt:     player.lastLoginAt.toISOString(),
      nameChangesLeft: player.nameChangesLeft,
    }

    return NextResponse.json({ data: dto })
  } catch (err) {
    console.error('[GET /api/auth/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
