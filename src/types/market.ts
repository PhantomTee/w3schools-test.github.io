export type MetricType = 'FINAL_VIEWS' | 'FINAL_LIKES' | 'FINAL_REPOSTS' | 'FINAL_REPLIES'
export type MarketState = 'OPEN' | 'LOCKED' | 'RESOLVED' | 'VOIDED' | 'CANCELLED'

export interface Range {
  min: number
  max: number | null // null = open-ended (highest range)
  maxOpen: boolean
  label: string
  difficulty: number // 1-10
}

export interface Market {
  id: string
  chainMarketId: string | null
  contractAddress: string | null
  creatorWallet: string
  xUserIdHash: string
  tweetId: string
  metricType: MetricType
  startValue: string // BigInt serialised as string
  finalValue: string | null
  durationHours: number
  createdAt: string
  expiresAt: string
  state: MarketState
  ranges: Range[]
  genLayerReportHash: string | null
  creationTxHash: string | null
  resolutionTxHash: string | null
  winningRangeIndex: number | null
  protocolFeeBps: number
  totalStaked: string
}

export interface MarketWithPools extends Market {
  pools: { rangeIndex: number; amount: string }[]
  userStakes?: { rangeIndex: number; amount: string }[]
}

export interface MarketConfigInput {
  creator: `0x${string}`
  xUserIdHash: `0x${string}`
  tweetId: string
  metricType: number
  startValue: bigint
  createdAt: bigint
  marketStartTime: bigint
  marketEndTime: bigint
  rangesHash: `0x${string}`
  marketQuestionHash: `0x${string}`
  genLayerReportHash: `0x${string}`
  nonce: bigint
}

export interface CreateMarketRequest {
  tweetId: string
  metricType: MetricType
  durationHours: number
  walletAddress: string
}

export interface CreateMarketResponse {
  marketId: string
  contractAddress: string
  config: MarketConfigInput
  ranges: Range[]
  signature: `0x${string}`
  genLayerReport: GenLayerDesignResponse
}

export interface GenLayerDesignResponse {
  approved: boolean
  marketType: 'range_prediction'
  metricType: MetricType
  displayMetric: string
  durationHours: number
  startValue: number
  ranges: Range[]
  riskScore: number
  qualityScore: number
  reason: string
}

export interface GenLayerGuardResponse {
  approved: boolean
  riskScore: number
  rejectionReason: string | null
  flags: string[]
}

export interface GenLayerDisputeResponse {
  status: 'resolved' | 'void' | 'unresolvable'
  finalValue: number | null
  winningRangeIndex: number | null
  confidence: number
  reason: string
}
