'use client'

import { useState, useEffect, useMemo } from 'react'
import { playerNameSchema, getZodMessage } from '@/src/lib/validation'

export type NameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export interface CheckNameResult {
  status:  NameStatus
  message: string
}

interface AsyncNameCheck extends CheckNameResult {
  name: string
}

/**
 * Debounced name availability checker.
 * Validates format with Zod client-side first, then hits the API.
 *
 * @param name        The name string to check
 * @param debounceMs  Debounce delay (default 400ms)
 * @param skip        Set true to skip checking entirely
 */
export function useCheckName(
  name: string,
  debounceMs = 400,
  skip = false,
): CheckNameResult {
  const [result, setResult] = useState<AsyncNameCheck>({ name: '', status: 'idle', message: '' })
  const trimmed = name.trim()
  const validation = useMemo(() => playerNameSchema.safeParse(trimmed), [trimmed])

  useEffect(() => {
    if (!trimmed || skip || !validation.success) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/player/check-name?name=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
        const json = await res.json() as {
          data?: { available: boolean; name: string; reason?: string }
          error?: string
        }

        if (json.data?.available) {
          setResult({ name: trimmed, status: 'available', message: 'Name is available' })
        } else {
          setResult({
            name:    trimmed,
            status:  'taken',
            message: json.data?.reason ?? 'Name is already taken',
          })
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResult({ name: trimmed, status: 'idle', message: '' })
        }
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, debounceMs, skip, validation])

  if (!trimmed || skip) return { status: 'idle', message: '' }
  if (!validation.success) {
    return { status: 'invalid', message: getZodMessage(validation.error) }
  }
  if (result.name === trimmed && (result.status === 'available' || result.status === 'taken')) {
    return { status: result.status, message: result.message }
  }
  return { status: 'checking', message: '' }
}
