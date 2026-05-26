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
export interface PlayerDTO {
  id:           string
  walletAddress: string
  name:         string
  avatarIdx:    number
  totalPoints:  number
  level:        number
  streakDays:   number
  referralCode: string
  lastLoginAt:  string
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
  rewardType: string
  amount:     number
  label:      string
  claimedAt:  string
}

export interface DailyClaimStatusDTO {
  claimed:    boolean
  reward:     DailyClaimDTO | null
}

// ─── Friends ─────────────────────────────────────────────────────────────────
export interface FriendDTO {
  id:        string
  name:      string
  avatarIdx: number
  joinedAt:  string
  rewarded:  boolean
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export interface LeaderboardEntryDTO {
  rank:      number
  playerId:  string
  name:      string
  avatarIdx: number
  score:     number
  wins:      number
  streak:    number
  tier:      string
}
