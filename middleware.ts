/**
 * Next.js Middleware — session guard for hub pages.
 *
 * Runs on the Edge before any page or API route handler.
 * For hub routes (/home, /tasks, /leaderboard, /friends, /redeem, /game):
 *   - Verify the cetas_session JWT
 *   - If missing or invalid → clear cookies + redirect to /
 *
 * API routes are NOT guarded here (they handle auth themselves).
 * The landing page (/) is always public.
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'cetas_session'
const CHALLENGE_COOKIE = 'cetas_auth_challenge'

// Hub routes that require authentication
const PROTECTED_PATHS = ['/home', '/tasks', '/leaderboard', '/friends', '/redeem', '/game']

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

function clearAndRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = '/'
  url.search = ''

  const res = NextResponse.redirect(url)

  // Clear both session and challenge cookies
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  })
  res.cookies.set(CHALLENGE_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  })

  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard hub pages
  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value

  // No cookie → clear + redirect
  if (!token) return clearAndRedirect(req)

  // Invalid/expired JWT → clear + redirect
  const valid = await verifySession(token)
  if (!valid) return clearAndRedirect(req)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/home/:path*',
    '/tasks/:path*',
    '/leaderboard/:path*',
    '/friends/:path*',
    '/redeem/:path*',
    '/game/:path*',
  ],
}
