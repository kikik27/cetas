// GET  /api/player   — fetch current player profile
// POST /api/player   — update name and/or avatar
//
// Name rules:
//   - Must be unique (case-insensitive)
//   - First set from an old "Commander" placeholder: free
//   - Subsequent renames: consume 1 from nameChangesLeft

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { getSessionFromRequest, setSessionCookie, signSession } from '@/src/lib/session'
import { updatePlayerBodySchema, getZodMessage } from '@/src/lib/validation'
import { toPlayerDTO } from '@/src/lib/player-dto'
import { generateReferralCode } from '@/src/lib/referral-code'
import { isUniqueConstraintError } from '@/src/lib/prisma-errors'

const DEFAULT_NAME = 'Commander'
const REFERRAL_CODE_RETRIES = 5

export async function GET(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const player = await prisma.player.findUnique({ where: { id: auth.playerId } })
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    return NextResponse.json({ data: toPlayerDTO(player) })
  } catch (err) {
    console.error('[GET /api/player]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ── Validate ───────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const parsed = updatePlayerBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodMessage(parsed.error) },
        { status: 400 }
      )
    }
    const { name, avatarIdx } = parsed.data

    // ── Fetch current player ───────────────────────────────────────────────
    const current = session.playerId
      ? await prisma.player.findUnique({ where: { id: session.playerId } })
      : await prisma.player.findUnique({ where: { walletAddress: session.walletAddress } })

    if (!current && name === undefined) {
      return NextResponse.json(
        { error: 'Name is required to create your player profile.' },
        { status: 400 }
      )
    }

    const isNameChange   = name !== undefined && name !== current?.name
    const isFirstTimeSet = current?.name === DEFAULT_NAME

    // ── Name change quota ──────────────────────────────────────────────────
    if (current && isNameChange && !isFirstTimeSet && current.nameChangesLeft <= 0) {
      return NextResponse.json(
        { error: 'No name changes remaining. You can only rename once after onboarding.' },
        { status: 400 }
      )
    }

    // ── Unique name check ──────────────────────────────────────────────────
    if (isNameChange) {
      const taken = await prisma.player.findFirst({
        where: {
          name:  { equals: name, mode: 'insensitive' },
          ...(current && { id: { not: current.id } }),
        },
        select: { id: true },
      })
      if (taken) {
        return NextResponse.json(
          { error: 'Name is already taken. Please choose another.' },
          { status: 409 }
        )
      }
    }

    if (!current) {
      const player = await createPlayerProfile({
        walletAddress: session.walletAddress,
        name:          name!,
        avatarIdx:     avatarIdx ?? 1,
      })

      const token = await signSession({
        playerId:      player.id,
        walletAddress: player.walletAddress,
      })

      const res = NextResponse.json({ data: toPlayerDTO(player) })
      setSessionCookie(res, token)
      return res
    }

    const consumeQuota = isNameChange && !isFirstTimeSet

    const player = await prisma.player.update({
      where: { id: current.id },
      data: {
        ...(name      !== undefined && { name }),
        ...(avatarIdx !== undefined && { avatarIdx }),
        ...(consumeQuota && { nameChangesLeft: { decrement: 1 } }),
      },
    })

    return NextResponse.json({ data: toPlayerDTO(player) })
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json(
        { error: 'Name is already taken. Please choose another.' },
        { status: 409 }
      )
    }

    console.error('[POST /api/player]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createPlayerProfile(input: {
  walletAddress: string
  name: string
  avatarIdx: number
}) {
  let lastError: unknown

  for (let attempt = 0; attempt < REFERRAL_CODE_RETRIES; attempt++) {
    try {
      return await prisma.player.create({
        data: {
          walletAddress:    input.walletAddress,
          name:             input.name,
          avatarIdx:        input.avatarIdx,
          referralCode:     generateReferralCode(),
          lastLoginAt:      new Date(),
        },
      })
    } catch (err) {
      lastError = err
      if (!isUniqueConstraintError(err)) throw err
    }
  }

  throw lastError
}
