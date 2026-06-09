export interface SessionUser {
  walletAddress: string
  xUserId?: string
  xUsername?: string
  xConnectedAt?: string
}

export interface UserProfile {
  walletAddress:       string
  xUserId:             string | null
  xUsername:           string | null
  xConnectedAt:        string | null
  xAvatarUrl:          string | null
  xFollowerCount:      number | null
  marketsCreatedToday: number
  totalMarketsCreated: number
}
