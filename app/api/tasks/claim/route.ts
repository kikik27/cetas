// POST /api/tasks/claim — claim reward for a completed task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import { claimTaskBodySchema, getZodMessage } from '@/src/lib/validation'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function levelForExperience(experience: number): number {
  return Math.max(1, Math.floor(experience / 500) + 1)
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

    const [updatedProgress, updatedPlayer] = await prisma.$transaction(async tx => {
      const claim = await tx.taskProgress.updateMany({
        where: {
          playerId: auth.playerId,
          taskId,
          date,
          claimedAt: null,
          progress: { gte: def.total },
        },
        data: { done: true, claimedAt: new Date() },
      })

      if (claim.count !== 1) {
        const progress = await tx.taskProgress.findUnique({
          where: { playerId_taskId_date: { playerId: auth.playerId, taskId, date } },
        })
        if (!progress) throw new Error('NO_PROGRESS')
        if (progress.claimedAt) throw new Error('ALREADY_CLAIMED')
        throw new Error('TASK_NOT_COMPLETED')
      }

      const current = await tx.player.findUniqueOrThrow({
        where: { id: auth.playerId },
        select: { experience: true },
      })
      const nextExperience = current.experience + def.reward

      const [progress, player] = await Promise.all([
        tx.taskProgress.findUniqueOrThrow({
          where: { playerId_taskId_date: { playerId: auth.playerId, taskId, date } },
        }),
        tx.player.update({
          where: { id: auth.playerId },
          data:  {
            experience: { increment: def.reward },
            level:      { set: levelForExperience(nextExperience) },
          },
        }),
      ])

      return [progress, player] as const
    })

    return NextResponse.json({
      data: {
        taskId,
        reward:      def.reward,
        experience:  updatedPlayer.experience,
        level:       updatedPlayer.level,
        claimedAt:   updatedProgress.claimedAt?.toISOString(),
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_PROGRESS') {
      return NextResponse.json({ error: 'No progress found for today' }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'TASK_NOT_COMPLETED') {
      return NextResponse.json({ error: 'Task not completed yet' }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }
    console.error('[POST /api/tasks/claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
