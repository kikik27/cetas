// POST /api/tasks/claim — claim reward for a completed task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { claimTaskBodySchema, getZodMessage } from '@/src/lib/validation'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = claimTaskBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: getZodMessage(parsed.error) }, { status: 400 })
    }
    const { taskId } = parsed.data

    const date = todayKey()

    const def = await prisma.taskDefinition.findUnique({ where: { id: taskId } })
    if (!def) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const progress = await prisma.taskProgress.findUnique({
      where: { playerId_taskId_date: { playerId: auth.playerId, taskId, date } },
    })

    if (!progress)                  return NextResponse.json({ error: 'No progress found for today' }, { status: 400 })
    if (progress.progress < def.total) return NextResponse.json({ error: 'Task not completed yet' }, { status: 400 })
    if (progress.claimedAt)         return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

    const [updatedProgress, updatedPlayer] = await prisma.$transaction([
      prisma.taskProgress.update({
        where: { id: progress.id },
        data:  { done: true, claimedAt: new Date() },
      }),
      prisma.player.update({
        where: { id: auth.playerId },
        data:  { totalPoints: { increment: def.reward } },
      }),
    ])

    return NextResponse.json({
      data: {
        taskId,
        reward:      def.reward,
        totalPoints: updatedPlayer.totalPoints,
        claimedAt:   updatedProgress.claimedAt?.toISOString(),
      },
    })
  } catch (err) {
    console.error('[POST /api/tasks/claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
