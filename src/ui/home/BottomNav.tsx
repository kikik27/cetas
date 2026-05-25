'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Swords, CheckSquare, Trophy, Star, Lock, type LucideIcon } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface NavItem {
  href:    string
  label:   string
  icon:    LucideIcon
  enabled: boolean
}

const ITEMS: NavItem[] = [
  { href: '/home',        label: 'Home',   icon: Home,        enabled: true  },
  { href: '/tasks',       label: 'Quests', icon: CheckSquare, enabled: true  },
  { href: '/leaderboard', label: 'Ranks',  icon: Trophy,      enabled: true  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                 flex items-stretch
                 border-t border-[rgba(200,146,42,0.18)]
                 bg-[rgba(10,8,20,0.97)] backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {ITEMS.map(item => {
        const Icon      = item.icon
        const isCurrent = pathname === item.href

        if (!item.enabled) {
          return (
            <div
              key={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-[3px]
                         py-2.5 px-1 opacity-30 cursor-not-allowed select-none"
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="font-display text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]">
                {item.label}
              </span>
              <Lock className="absolute top-1.5 right-2 h-2 w-2 text-[var(--text-3)]" />
            </div>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-[3px]',
              'py-2.5 px-1 transition-colors duration-150 no-underline',
              isCurrent ? 'text-[var(--gold-hi)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="font-display text-[8px] font-semibold uppercase tracking-[0.08em]">
              {item.label}
            </span>

            {/* Active pip */}
            {isCurrent && (
              <span
                aria-hidden
                className="absolute bottom-1 left-1/2 -translate-x-1/2
                           h-0.5 w-5 rounded-full
                           bg-gradient-to-r from-[var(--gold-lo)] via-[var(--gold-hi)] to-[var(--gold-lo)]
                           shadow-[0_0_8px_rgba(200,146,42,0.7)]"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
