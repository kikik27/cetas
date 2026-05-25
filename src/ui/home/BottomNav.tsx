'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'

type NavItem = {
  href:  string
  label: string
  src:   string
  alt:   string
}

const ITEMS: NavItem[] = [
  { href: '/home',        label: 'Home',    src: '/assets/ui/home.png',        alt: 'Home'        },
  { href: '/tasks',       label: 'Quests',  src: '/assets/ui/task.png',        alt: 'Quests'      },
  { href: '/friends',     label: 'Friends', src: '/assets/ui/friends.png',     alt: 'Friends'     },
  { href: '/leaderboard', label: 'Ranks',   src: '/assets/ui/leaderboard.png', alt: 'Leaderboard' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                 flex items-stretch
                 border-t border-[var(--border-gold)]
                 bg-[rgba(4,16,33,0.97)] backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {ITEMS.map(item => {
        const isCurrent = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-[3px]',
              'py-2.5 px-1 transition-all duration-150 no-underline',
            )}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={22}
              height={22}
              loading="eager"
              unoptimized
              className={cn(
                'pixel object-contain transition-all duration-150',
                isCurrent
                  ? 'opacity-100 drop-shadow-[0_0_6px_rgba(200,146,42,0.8)]'
                  : 'opacity-40'
              )}
            />
            <span className={cn(
              'font-display text-[8px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150',
              isCurrent ? 'text-[var(--gold-hi)]' : 'text-[var(--text-3)]'
            )}>
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
