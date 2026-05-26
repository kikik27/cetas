// Seed script — ES module version for easy execution on Windows
// Run: node prisma/seed.mjs

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Load env
const dotenv = require('dotenv')
dotenv.config()
dotenv.config({ path: '.env.local', override: false })

const { PrismaClient } = require('@prisma/client')
const { PrismaNeon }   = require('@prisma/adapter-neon')
const { neonConfig }   = require('@neondatabase/serverless')
const ws               = require('ws')

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma  = new PrismaClient({ adapter })

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
