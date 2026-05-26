/**
 * Prisma client singleton — Neon Serverless Postgres.
 *
 * IMPORTANT: DATABASE_URL must be in .env.local (not .env) so Next.js
 * loads it before any module code runs.
 *
 * Uses @neondatabase/serverless + @prisma/adapter-neon.
 * Prisma 7 requires a driver adapter (url no longer in schema.prisma).
 */
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// WebSocket required for interactive transactions in Node.js runtime
neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Make sure it is defined in .env.local (not .env — Next.js does not auto-load plain .env files).'
    )
  }

  const adapter = new PrismaNeon({ connectionString })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient())
