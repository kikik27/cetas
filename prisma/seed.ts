// Seed task definitions — run once after migration
// npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
// OR: npx prisma db seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TASK_DEFS = [
  { id: 'play1',   label: 'First Battle', desc: 'Play 1 match today',      reward: 50,  total: 1, iconId: 'swords', sortOrder: 0 },
  { id: 'play3',   label: 'Warrior',      desc: 'Play 3 matches today',    reward: 120, total: 3, iconId: 'shield', sortOrder: 1 },
  { id: 'win1',    label: 'Victor',       desc: 'Win 1 match',             reward: 80,  total: 1, iconId: 'trophy', sortOrder: 2 },
  { id: 'reroll5', label: 'Gambler',      desc: 'Reroll the shop 5 times', reward: 30,  total: 5, iconId: 'zap',    sortOrder: 3 },
  { id: 'merge1',  label: 'Alchemist',    desc: 'Merge a unit to star 2',  reward: 60,  total: 1, iconId: 'star',   sortOrder: 4 },
  { id: 'streak',  label: 'Daily Streak', desc: 'Log in 3 days in a row',  reward: 200, total: 3, iconId: 'flame',  sortOrder: 5 },
]

async function main() {
  console.log('Seeding task definitions...')

  for (const def of TASK_DEFS) {
    await prisma.taskDefinition.upsert({
      where:  { id: def.id },
      update: def,
      create: def,
    })
    console.log(`  ✓ ${def.id}`)
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
