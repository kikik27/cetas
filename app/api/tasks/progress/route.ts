// POST /api/tasks/progress — increment task progress (called from game events)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wallet: string; taskId: string; increment?: number }
    const { wallet, taskId, increment = 1 } = body

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

    // Upsert progress record
    const progress = await prisma.taskProgress.upsert({
      where: { playerId_taskId_date: { playerId: player.id, taskId, date } },
      create: {
        playerId: player.id,
        taskId,
        date,
        progress: Math.min(increment, def.total),
        done:     increment >= def.total,
      },
      update: {
        progress: { increment },
      },
    })

    // Cap progress at total
    if (progress.progress > def.total) {
      await prisma.taskProgress.update({
        where: { id: progress.id },
        data:  { progress: def.total, done: true },
      })
    }

    return NextResponse.json({
      data: {
        taskId,
        progress: Math.min(progress.progress, def.total),
        done:     progress.progress >= def.total,
      },
    })
  } catch (err) {
    console.error('[POST /api/tasks/progress]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
