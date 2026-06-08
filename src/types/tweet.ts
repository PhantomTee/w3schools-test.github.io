export interface TweetPublicMetrics {
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
  impression_count?: number
  bookmark_count?: number
}

export interface Tweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics: TweetPublicMetrics
  lang?: string
  possibly_sensitive?: boolean
  referenced_tweets?: Array<{ type: string; id: string }>
}

export interface NormalizedTweetMetrics {
  views: number | null       // impression_count
  likes: number
  reposts: number            // retweet_count
  replies: number
  quotes: number
  bookmarks: number
}

export interface EligibleTweet extends Tweet {
  eligible: boolean
  eligibilityNote: string | null
  normalizedMetrics: NormalizedTweetMetrics
  ageMinutes: number
  activeMarketCount: number
}
