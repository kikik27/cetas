import type { Prisma } from '@prisma/client'
import type { PlayerDTO, PlayerGameProgressDTO } from './api-types'

export type PlayerDTORecord = {
  id: string
  walletAddress: string
  name: string
  avatarIdx: number
  totalPoints: number
  level: number
  endlessStage: number
  bestStage: number
  gameProgress: Prisma.JsonValue | null
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
    endlessStage:    player.endlessStage,
    bestStage:       player.bestStage,
    gameProgress:    player.gameProgress as PlayerGameProgressDTO | null,
    streakDays:      player.streakDays,
    referralCode:    player.referralCode,
    lastLoginAt:     player.lastLoginAt.toISOString(),
    nameChangesLeft: player.nameChangesLeft,
  }
}
