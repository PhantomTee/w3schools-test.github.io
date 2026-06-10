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
  marketsCreatedToday: number
  totalMarketsCreated: number
}
