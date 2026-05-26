/**
 * POST /api/auth/login
 *
 * Called right after wagmi auto-connects with the wallet address.
 * Loads the player profile if it exists, then issues a session cookie.
 * New wallets get a wallet-only session; /api/player creates the profile
 * after onboarding submits a valid name.
 *
 * Why no SIWE here:
 * MiniPay docs explicitly state "Do not prompt users to sign a message to
 * access your site or to authenticate." The injected window.ethereum address
 * is already trusted by MiniPay. The httpOnly session cookie protects against
 * XSS replay on the server side.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { signSession, setSessionCookie } from '@/src/lib/session'
import { loginBodySchema, getZodMessage } from '@/src/lib/validation'
import type { LoginResponseDTO } from '@/src/lib/api-types'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  try {
    // ── Validate input ─────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const parsed = loginBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodMessage(parsed.error) },
        { status: 400 }
      )
    }
    const { wallet } = parsed.data

    // ── Load existing player ───────────────────────────────────────────────
    let player = await prisma.player.findUnique({ where: { walletAddress: wallet } })
    const isNewPlayer = !player

    if (player) {
      const lastLogin = player.lastLoginAt.toISOString().slice(0, 10)
      const today     = todayKey()
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

      let streakDays = player.streakDays
      if (lastLogin === yesterday)     streakDays += 1
      else if (lastLogin !== today)    streakDays = 1

      player = await prisma.player.update({
        where: { id: player.id },
        data:  { lastLoginAt: new Date(), streakDays },
      })
    }

    // ── Issue session JWT ──────────────────────────────────────────────────
    const token = await signSession({
      ...(player && { playerId: player.id }),
      walletAddress: wallet,
    })

    const dto: LoginResponseDTO = {
      walletAddress: wallet,
      isNewPlayer,
      player: player
        ? {
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
        : null,
    }

    const res = NextResponse.json({ data: dto })
    setSessionCookie(res, token)
    return res

  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
