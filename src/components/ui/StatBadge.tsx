import type { LucideIcon } from 'lucide-react'

interface StatBadgeProps {
  icon:      LucideIcon
  value:     number | string
  colorClass?: string   // e.g. 'text-[var(--stat-atk)]'
  size?:     'xs' | 'sm'
}

/**
 * Compact inline stat display: [icon] value
 * Used in: Bench, Shop, EnemyIntel
 */
export default function StatBadge({
  icon: Icon,
  value,
  colorClass = 'text-[var(--text-2)]',
  size = 'xs',
}: StatBadgeProps) {
  const iconSize  = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  const textSize  = size === 'xs' ? 'text-[8px]'  : 'text-[10px]'

  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize} ${colorClass}`}>
      <Icon className={iconSize} />
      {value}
    </span>
  )
}
