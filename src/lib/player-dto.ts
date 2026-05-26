import type { PlayerDTO } from './api-types'

export type PlayerDTORecord = {
  id: string
  walletAddress: string
  name: string
  avatarIdx: number
  totalPoints: number
  level: number
  streakDays: number
  referralCode: string
  lastLoginAt: Date
  nameChangesLeft: number
}

export function toPlayerDTO(player: PlayerDTORecord): PlayerDTO {
  return {
    id:              player.id,
    walletAddress:   player.walletAddress,
    name:            player.name,
    avatarIdx:       player.avatarIdx,
    totalPoints:     player.totalPoints,
    level:           player.level,
    streakDays:      player.streakDays,
    referralCode:    player.referralCode,
    lastLoginAt:     player.lastLoginAt.toISOString(),
    nameChangesLeft: player.nameChangesLeft,
  }
}
