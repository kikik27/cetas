// Shared API response types — used by both route handlers and client hooks

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: string
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ─── Player ───────────────────────────────────────────────────────────────────
export interface SavedGameUnitDTO {
  id: string
  stars: 1 | 2 | 3
}

export type SavedGameBoardDTO = (SavedGameUnitDTO | null)[][]
export type SavedGameBenchDTO = (SavedGameUnitDTO | null)[]

export interface PlayerGameProgressDTO {
  stage: number
  hp: number
  gold: number
  maxBoardSlots: number
  rerollsLeft?: number
  board: SavedGameBoardDTO
  bench: SavedGameBenchDTO
}

export interface PlayerDTO {
  id:              string
  walletAddress:   string
  name:            string
  avatarIdx:       number
  totalPoints:     number
  experience:      number
  level:           number
  endlessStage:    number
  bestStage:       number
  gameProgress:    PlayerGameProgressDTO | null
  streakDays:      number
  referralCode:    string
  lastLoginAt:     string
  nameChangesLeft: number
}

export interface LoginResponseDTO {
  /** true = first time this wallet has logged in → show onboarding */
  isNewPlayer: boolean
  walletAddress: string
  player: PlayerDTO | null
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export interface TaskDefDTO {
  id:       string
  label:    string
  desc:     string
  reward:   number
  total:    number
  iconId:   string
  sortOrder: number
}

export interface TaskProgressDTO {
  taskId:    string
  date:      string
  progress:  number
  done:      boolean
  claimedAt: string | null
}

export interface TaskWithProgressDTO extends TaskDefDTO {
  progress:  number
  done:      boolean
  claimedAt: string | null
}

// ─── Daily Claim ──────────────────────────────────────────────────────────────
export interface DailyClaimDTO {
  date:       string
  rewardType: 'xp'
  amount:     number
  label:      string
  claimedAt:  string
}

export interface DailyClaimStatusDTO {
  claimed:    boolean
  reward:     DailyClaimDTO | null
}

// ─── Redeem ──────────────────────────────────────────────────────────────────
export interface PointRedemptionDTO {
  id:         string
  points:     number
  celoAmount: string
  status:     'mocked' | 'pending' | 'confirmed' | 'failed'
  txHash:     string | null
  createdAt:  string
}

export interface RedeemSummaryDTO {
  totalPoints: number
  minPoints:   number
  maxPoints:   number
  rateLabel:   string
  celoPerPoint: number
  dailyLimit:  number
  redeemedToday: number
  mock:        boolean
  history:     PointRedemptionDTO[]
}

export interface RedeemResponseDTO {
  totalPoints: number
  redemption:  PointRedemptionDTO
  mock:        boolean
  rateLabel:   string
}

// ─── Friends ─────────────────────────────────────────────────────────────────
export interface FriendDTO {
  id:        string
  name:      string
  avatarIdx: number
  joinedAt:  string
  rewarded:  boolean
  relation:  'outbound' | 'inbound'
  claimable: boolean
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export interface LeaderboardEntryDTO {
  rank:      number
  playerId:  string
  name:      string
  avatarIdx: number
  score:     number
  points:    number
  experience: number
  level:     number
  bestStage: number
  wins:      number
  streak:    number
  tier:      string
}
