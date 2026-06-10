/**
 * X (Twitter) API v2 integration.
 *
 * - OAuth 2.0 PKCE for user auth
 * - Tweets fetched from /2/users/:id/tweets
 * - public_metrics used for all market metrics
 * - impression_count used for views
 */
import crypto from 'crypto'
import type { Tweet, NormalizedTweetMetrics, EligibleTweet } from '@/types/tweet'

const X_API_BASE   = 'https://api.twitter.com'  // REST API calls
const X_OAUTH_BASE = 'https://x.com'             // OAuth page — sessions live on x.com, not twitter.com
const CLIENT_ID  = process.env.X_CLIENT_ID!
const CLIENT_SECRET = process.env.X_CLIENT_SECRET!
const CALLBACK_URL  = process.env.X_CALLBACK_URL!

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

export function generateOAuthState(): string {
  return crypto.randomBytes(16).toString('hex')
}

// ─── OAuth URLs ───────────────────────────────────────────────────────────────

export function getOAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             CLIENT_ID,
    redirect_uri:          CALLBACK_URL,
    scope:                 'tweet.read users.read offline.access',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${X_OAUTH_BASE}/i/oauth2/authorize?${params}`
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export interface XTokens {
  accessToken:  string
  refreshToken: string
  expiresAt:    Date
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<XTokens> {
  const body = new URLSearchParams({
    code,
    grant_type:    'authorization_code',
    client_id:     CLIENT_ID,
    redirect_uri:  CALLBACK_URL,
    code_verifier: codeVerifier,
  })

  const res = await fetch(`${X_API_BASE}/2/oauth2/token`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`X token exchange failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + data.expires_in * 1000),
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<XTokens> {
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
    client_id:     CLIENT_ID,
  })

  const res = await fetch(`${X_API_BASE}/2/oauth2/token`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`X token refresh failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt:    new Date(Date.now() + data.expires_in * 1000),
  }
}

// ─── User info ────────────────────────────────────────────────────────────────

export interface XUser {
  id:            string
  name:          string
  username:      string
  avatarUrl?:    string
  followerCount?: number
}

export async function getUserByMe(accessToken: string): Promise<XUser> {
  const res = await fetch(
    `${X_API_BASE}/2/users/me?user.fields=id,name,username,profile_image_url,public_metrics`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`X /users/me failed: ${res.status} ${err}`)
  }
  const { data } = await res.json()
  return {
    id:            data.id,
    name:          data.name,
    username:      data.username,
    avatarUrl:     data.profile_image_url?.replace('_normal', '_400x400') ?? undefined,
    followerCount: data.public_metrics?.followers_count ?? undefined,
  }
}

export async function postTweet(text: string, accessToken: string): Promise<{ id: string }> {
  const res = await fetch(`${X_API_BASE}/2/tweets`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`X POST /2/tweets failed: ${res.status} ${err}`)
  }
  const { data } = await res.json()
  return { id: data.id }
}

// ─── Tweet fields ─────────────────────────────────────────────────────────────

const TWEET_FIELDS =
  'created_at,author_id,public_metrics,text,possibly_sensitive,referenced_tweets,lang'

export async function getUserTweets(
  xUserId:     string,
  accessToken: string,
  startTime?:  Date,
  maxResults   = 20
): Promise<Tweet[]> {
  const params = new URLSearchParams({
    max_results:  String(Math.min(maxResults, 100)),
    tweet_fields: TWEET_FIELDS,
    exclude:      'retweets',
  })

  if (startTime) {
    params.set('start_time', startTime.toISOString())
  }

  const res = await fetch(
    `${X_API_BASE}/2/users/${xUserId}/tweets?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`X /users/${xUserId}/tweets failed: ${res.status} ${err}`)
  }

  const { data } = await res.json()
  return (data ?? []) as Tweet[]
}

export async function getTweetById(
  tweetId:     string,
  accessToken: string
): Promise<Tweet | null> {
  const params = new URLSearchParams({ tweet_fields: TWEET_FIELDS })
  const res = await fetch(
    `${X_API_BASE}/2/tweets/${tweetId}?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`X /tweets/${tweetId} failed: ${res.status} ${err}`)
  }

  const { data } = await res.json()
  return data as Tweet
}

// ─── Metrics normalisation ────────────────────────────────────────────────────

export function normalizeTweetMetrics(tweet: Tweet): NormalizedTweetMetrics {
  const m = tweet.public_metrics
  return {
    views:     m.impression_count ?? null,
    likes:     m.like_count       ?? 0,
    reposts:   m.retweet_count    ?? 0,
    replies:   m.reply_count      ?? 0,
    quotes:    m.quote_count      ?? 0,
    bookmarks: m.bookmark_count   ?? 0,
  }
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

export function isTweetEligible(
  tweet:        Tweet,
  xConnectedAt: Date,
  now:          Date = new Date()
): { eligible: boolean; reason: string | null } {
  const tweetTime = new Date(tweet.created_at)
  const ageMs     = now.getTime() - tweetTime.getTime()

  if (tweetTime < xConnectedAt)
    return { eligible: false, reason: 'Tweet was posted before you connected your X account.' }

  if (ageMs > THREE_HOURS_MS)
    return { eligible: false, reason: 'Tweet is older than 3 hours.' }

  if (tweet.referenced_tweets?.some(r => r.type === 'retweeted'))
    return { eligible: false, reason: 'Retweets cannot be used as markets.' }

  if (tweet.referenced_tweets?.some(r => r.type === 'replied_to'))
    return { eligible: false, reason: 'Reply tweets are not eligible at MVP stage.' }

  if (!tweet.public_metrics)
    return { eligible: false, reason: 'No public metrics available for this tweet.' }

  return { eligible: true, reason: null }
}

export function enrichTweets(
  tweets:         Tweet[],
  xConnectedAt:   Date,
  activeMarkets:  Map<string, number>
): EligibleTweet[] {
  const now = new Date()
  return tweets.map(t => {
    const { eligible, reason } = isTweetEligible(t, xConnectedAt, now)
    const ageMinutes = (now.getTime() - new Date(t.created_at).getTime()) / 60_000
    return {
      ...t,
      eligible,
      eligibilityNote:  reason,
      normalizedMetrics: normalizeTweetMetrics(t),
      ageMinutes:       Math.round(ageMinutes),
      activeMarketCount: activeMarkets.get(t.id) ?? 0,
    }
  })
}

