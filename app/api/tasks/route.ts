// GET /api/tasks?date=YYYY-MM-DD  — fetch tasks + today's progress

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/api-auth'
import type { TaskWithProgressDTO } from '@/src/lib/api-types'

type TaskDefinitionRow = {
  id: string
  label: string
  desc: string
  reward: number
  total: number
  iconId: string
  sortOrder: number
}

type TaskProgressRow = {
  taskId: string
  progress: number
  done: boolean
  claimedAt: Date | null
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { auth, error } = await requireAuth(req)
  if (error) return error

  const date = req.nextUrl.searchParams.get('date') ?? todayKey()

  try {
    const [defs, progresses]: [TaskDefinitionRow[], TaskProgressRow[]] = await Promise.all([
      prisma.taskDefinition.findMany({
        where:   { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.taskProgress.findMany({
        where: { playerId: auth.playerId, date },
      }),
    ])

    const progressMap = new Map(progresses.map((p: TaskProgressRow) => [p.taskId, p]))

    const tasks: TaskWithProgressDTO[] = defs.map((def: TaskDefinitionRow) => {
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
