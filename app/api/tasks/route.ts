// GET  /api/tasks?wallet=0x...&date=YYYY-MM-DD  — fetch tasks + today's progress
// POST /api/tasks/claim                          — claim a completed task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import type { TaskWithProgressDTO } from '@/src/lib/api-types'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  const date   = req.nextUrl.searchParams.get('date') ?? todayKey()

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  try {
    const player = await prisma.player.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    })
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Fetch all active task definitions
    const defs = await prisma.taskDefinition.findMany({
      where:   { active: true },
      orderBy: { sortOrder: 'asc' },
    })

    // Fetch today's progress for this player
    const progresses = await prisma.taskProgress.findMany({
      where: { playerId: player.id, date },
    })

    const progressMap = new Map(progresses.map(p => [p.taskId, p]))

    const tasks: TaskWithProgressDTO[] = defs.map(def => {
      const prog = progressMap.get(def.id)
      return {
        id:        def.id,
        label:     def.label,
        desc:      def.desc,
        reward:    def.reward,
        total:     def.total,
        iconId:    def.iconId,
        sortOrder: def.sortOrder,
        progress:  prog ? prog.progress : 0,
        done:      prog ? prog.done : false,
        claimedAt: prog?.claimedAt?.toISOString() ?? null,
      }
    })

    return NextResponse.json({ data: tasks })
  } catch (err) {
    console.error('[GET /api/tasks]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
