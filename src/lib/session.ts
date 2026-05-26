/**
 * Session management — httpOnly JWT cookie.
 *
 * Why JWT + cookie (not sign message):
 * - MiniPay docs: "Do not prompt users to sign a message to access your site"
 * - MiniPay already guarantees the injected address belongs to the user
 * - We trust the address from wagmi, create a server-side session from it
 * - httpOnly cookie prevents XSS from stealing the token
 *
 * Uses `jose` (Edge-compatible, no Node.js crypto dependency).
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'cetas_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30  // 30 days

export interface SessionPayload {
  playerId?:     string
  walletAddress: string
  /** issued-at (unix seconds) */
  iat?: number
  /** expiry (unix seconds) */
  exp?: number
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is not set')
  return new TextEncoder().encode(secret)
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ─── Cookie helpers (Server Components / Route Handlers) ─────────────────────

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',
  })
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  })
}

// ─── Middleware helper — read session from request ────────────────────────────

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}
