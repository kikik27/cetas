/**
 * API route auth helper.
 *
 * Resolves the authenticated player ID from:
 * 1. Session cookie (preferred — set by /api/auth/login)
 * 2. wallet query/body param (fallback for dev/testing)
 *
 * Usage in route handlers:
 *   const auth = await resolveAuth(req)
 *   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   const { playerId, walletAddress } = auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './session'
import { prisma } from './db'

export interface AuthContext {
  playerId:      string
  walletAddress: string
}

export async function resolveAuth(req: NextRequest): Promise<AuthContext | null> {
  // 1. Try session cookie first
  const session = await getSessionFromRequest(req)
  if (session?.playerId) {
    return { playerId: session.playerId, walletAddress: session.walletAddress }
  }

  if (session) {
    const player = await prisma.player.findUnique({
      where: { walletAddress: session.walletAddress },
      select: { id: true, walletAddress: true },
    })

    if (!player) return null
    return { playerId: player.id, walletAddress: player.walletAddress }
  }

  // 2. Fallback: wallet address from query param or body
  //    Only allowed in development to ease local testing
  if (process.env.NODE_ENV !== 'development') return null

  const wallet =
    req.nextUrl.searchParams.get('wallet') ??
    (await tryParseBodyWallet(req))

  if (!wallet) return null

  const player = await prisma.player.findUnique({
    where: { walletAddress: wallet.toLowerCase() },
    select: { id: true, walletAddress: true },
  })

  if (!player) return null
  return { playerId: player.id, walletAddress: player.walletAddress }
}

/** Safely try to read wallet from JSON body without consuming the stream */
async function tryParseBodyWallet(req: NextRequest): Promise<string | null> {
  try {
    const clone = req.clone()
    const body = await clone.json() as { wallet?: string }
    return body.wallet ?? null
  } catch {
    return null
  }
}

/** Shorthand: resolve auth or return 401 response */
export async function requireAuth(
  req: NextRequest
): Promise<{ auth: AuthContext; error: null } | { auth: null; error: NextResponse }> {
  const auth = await resolveAuth(req)
  if (!auth) {
    return {
      auth: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { auth, error: null }
}
