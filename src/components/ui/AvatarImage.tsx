import Image from 'next/image'
import { cn } from '@/src/lib/utils'
import { avatarSrc } from '@/src/lib/assetPaths'

interface AvatarImageProps {
  idx:       string | number
  size?:     number
  className?: string
  priority?: boolean
  stars?:    number
}

/**
 * Reusable pixel-art avatar with optional star badge.
 * Used in: Bench, Shop, EnemyIntel, FriendsClient, LeaderboardClient, PlayerCard, LandingGate
 */
export default function AvatarImage({
  idx,
  size = 36,
  className,
  priority = false,
  stars,
}: AvatarImageProps) {
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width: size, height: size }}>
      <Image
        src={avatarSrc(idx)}
        alt=""
        aria-hidden
        width={size}
        height={size}
        unoptimized
        loading={priority ? 'eager' : 'lazy'}
        className="pixel h-full w-full object-cover"
      />
      {stars && stars > 1 && (
        <div className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-0.5
                        text-[7px] font-bold leading-tight text-[#fbbf24]">
          {'★'.repeat(stars)}
        </div>
      )}
    </div>
  )
}
