// POST /api/tasks/claim — claim reward for a completed task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wallet: string; taskId: string }
    const { wallet, taskId } = body

    if (!wallet || !taskId) {
      return NextResponse.json({ error: 'wallet and taskId required' }, { status: 400 })
    }

    const date = todayKey()

    const [player, def] = await Promise.all([
      prisma.player.findUnique({ where: { walletAddress: wallet.toLowerCase() } }),
      prisma.taskDefinition.findUnique({ where: { id: taskId } }),
    ])

    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    if (!def)    return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const progress = await prisma.taskProgress.findUnique({
      where: { playerId_taskId_date: { playerId: player.id, taskId, date } },
    })

    if (!progress) {
      return NextResponse.json({ error: 'No progress found for today' }, { status: 400 })
    }
    if (progress.progress < def.total) {
      return NextResponse.json({ error: 'Task not completed yet' }, { status: 400 })
    }
    if (progress.claimedAt) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }

    // Mark claimed + award points in a transaction
    const [updatedProgress, updatedPlayer] = await prisma.$transaction([
      prisma.taskProgress.update({
        where: { id: progress.id },
        data:  { done: true, claimedAt: new Date() },
      }),
      prisma.player.update({
        where: { id: player.id },
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
