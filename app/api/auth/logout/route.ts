/**
 * POST /api/auth/logout — clear session cookie
 */
import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/src/lib/session'

export async function POST() {
  const res = NextResponse.json({ data: { ok: true } })
  clearSessionCookie(res)
  return res
}
