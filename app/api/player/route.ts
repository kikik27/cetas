// GET  /api/player?wallet=0x...  — fetch or create player profile
// POST /api/player               — update player profile (name, avatar)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import type { PlayerDTO } from '@/src/lib/api-types'

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  try {
    // Upsert: create player on first visit
    let player = await prisma.player.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    })

    if (!player) {
      player = await prisma.player.create({
        data: {
          walletAddress: wallet.toLowerCase(),
          referralCode:  generateReferralCode(),
          lastLoginAt:   new Date(),
        },
      })
    } else {
      // Update streak logic
      const lastLogin = player.lastLoginAt.toISOString().slice(0, 10)
      const today     = todayKey()
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

      let streakDays = player.streakDays
      if (lastLogin === yesterday) {
        streakDays += 1
      } else if (lastLogin !== today) {
        streakDays = 1  // streak broken
      }

      player = await prisma.player.update({
        where: { id: player.id },
        data:  { lastLoginAt: new Date(), streakDays },
      })
    }

    const dto: PlayerDTO = {
      id:           player.id,
      walletAddress: player.walletAddress,
      name:         player.name,
      avatarIdx:    player.avatarIdx,
      totalPoints:  player.totalPoints,
      level:        player.level,
      streakDays:   player.streakDays,
      referralCode: player.referralCode,
      lastLoginAt:  player.lastLoginAt.toISOString(),
    }

    return NextResponse.json({ data: dto })
  } catch (err) {
    console.error('[GET /api/player]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wallet: string; name?: string; avatarIdx?: number }
    const { wallet, name, avatarIdx } = body

    if (!wallet) {
      return NextResponse.json({ error: 'wallet required' }, { status: 400 })
    }

    const player = await prisma.player.update({
      where: { walletAddress: wallet.toLowerCase() },
      data: {
        ...(name      !== undefined && { name }),
        ...(avatarIdx !== undefined && { avatarIdx }),
      },
    })

    const dto: PlayerDTO = {
      id:           player.id,
      walletAddress: player.walletAddress,
      name:         player.name,
      avatarIdx:    player.avatarIdx,
      totalPoints:  player.totalPoints,
      level:        player.level,
      streakDays:   player.streakDays,
      referralCode: player.referralCode,
      lastLoginAt:  player.lastLoginAt.toISOString(),
    }

    return NextResponse.json({ data: dto })
  } catch (err) {
    console.error('[POST /api/player]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
