// POST /api/tasks/progress — increment task progress (called from game events)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { progressTaskBodySchema, getZodMessage } from '@/src/lib/validation'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = progressTaskBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: getZodMessage(parsed.error) }, { status: 400 })
    }
    const { taskId, increment } = parsed.data

    const date = todayKey()

    const def = await prisma.taskDefinition.findUnique({ where: { id: taskId } })
    if (!def) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const progress = await prisma.taskProgress.upsert({
      where:  { playerId_taskId_date: { playerId: auth.playerId, taskId, date } },
      create: {
        playerId: auth.playerId,
        taskId,
        date,
        progress: Math.min(increment, def.total),
        done:     increment >= def.total,
      },
      update: { progress: { increment } },
    })

    // Cap at total
    const capped = Math.min(progress.progress, def.total)
    if (progress.progress > def.total) {
      await prisma.taskProgress.update({
        where: { id: progress.id },
        data:  { progress: def.total, done: true },
      })
    }

    return NextResponse.json({
      data: { taskId, progress: capped, done: capped >= def.total },
    })
  } catch (err) {
    console.error('[POST /api/tasks/progress]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
