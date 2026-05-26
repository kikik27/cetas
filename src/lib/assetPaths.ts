/**
 * Centralised asset path helpers.
 * Update paths here if the folder structure changes.
 */

/** Player/enemy avatar — padded index e.g. avatar-03.png */
export function avatarSrc(idx: string | number): string {
  const n = typeof idx === 'string' ? parseInt(idx, 10) : idx
  return `/assets/ui/avatars/avatar-${String(n).padStart(2, '0')}.png`
}

/** Unit sprite sheet for a given team + unit type + animation state */
export function unitSpriteSrc(
  team: 'blue' | 'red',
  unitType: string,
  state: string,
): string {
  return `/assets/units/${team}/${unitType}/${state}.png`
}

/** Arrow projectile sprite */
export function arrowSrc(team: 'blue' | 'red'): string {
  return `/assets/units/${team}/archer/arrow.png`
}

// ── UI icons ──────────────────────────────────────────────────────────────────
export const UI = {
  home:        '/assets/ui/home.png',
  task:        '/assets/ui/task.png',
  friends:     '/assets/ui/friends.png',
  leaderboard: '/assets/ui/leaderboard.png',
  closedChest: '/assets/ui/closed_chest.png',
  openedChest: '/assets/ui/opened_chest.png',
  goldIcon:    '/assets/ui/icons/icon-03.png',
} as const
