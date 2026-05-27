/**
 * Zod validation schemas — shared between API routes and client-side forms.
 *
 * NOTE: This project uses Zod v4.
 * In Zod v4, ZodError.message is a JSON string of the issues array.
 * Use `getZodMessage(error)` to extract the first human-readable message.
 */
import { z } from 'zod'

// ─── Zod v4 error helper ──────────────────────────────────────────────────────

/**
 * Extract the first human-readable message from a Zod v4 error.
 * Zod v4 stores issues as JSON in error.message instead of error.errors[].
 */
export function getZodMessage(error: z.ZodError): string {
  try {
    const issues = JSON.parse(error.message) as Array<{ message: string }>
    return issues[0]?.message ?? 'Validation error'
  } catch {
    return error.message ?? 'Validation error'
  }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

export const walletAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address')
  .transform(v => v.toLowerCase())

export const playerNameSchema = z
  .string()
  .trim()
  .min(2, 'At least 2 characters')
  .max(20, 'Max 20 characters')
  .regex(/^[a-zA-Z0-9_\- ]+$/, 'Only letters, numbers, spaces, _ and - allowed')

export const avatarIdxSchema = z
  .number()
  .int()
  .min(1, 'Invalid avatar')
  .max(25, 'Invalid avatar')

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginBodySchema = z.object({
  wallet: walletAddressSchema,
})

// ─── Player ───────────────────────────────────────────────────────────────────

export const updatePlayerBodySchema = z.object({
  name:      playerNameSchema.optional(),
  avatarIdx: avatarIdxSchema.optional(),
}).refine(data => data.name !== undefined || data.avatarIdx !== undefined, {
  message: 'At least one of name or avatarIdx must be provided',
})

export const checkNameQuerySchema = z.object({
  name: playerNameSchema,
})

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const claimTaskBodySchema = z.object({
  taskId: z.string().min(1, 'taskId required'),
})

export const progressTaskBodySchema = z.object({
  taskId:    z.string().min(1, 'taskId required'),
  increment: z.number().int().min(1).max(100).optional().default(1),
})

// ─── Redeem ──────────────────────────────────────────────────────────────────

export const redeemPointsBodySchema = z.object({
  points: z.number().int().min(100, 'Minimum redeem is 100 points').max(1_000_000),
})

// ─── Friends ─────────────────────────────────────────────────────────────────

export const claimFriendBodySchema = z.object({
  friendId: z.string().min(1, 'friendId required'),
})

export const referralCodeBodySchema = z.object({
  code: z
    .string()
    .min(4, 'Code too short')
    .max(10, 'Code too long')
    .transform(v => v.trim().toUpperCase()),
})
