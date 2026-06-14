/**
 * TwitterAPI.io integration — third-party scraper used for all tweet/user data
 * fetching so we don't need to call the official X API v2 endpoints (which
 * require an app attached to a Project).
 *
 * Auth: X-API-Key header with TWITTERAPI_IO_KEY env var.
 * Base: https://api.twitterapi.io
 */
import type { Tweet } from '@/types/tweet'

const BASE = 'https://api.twitterapi.io'

function reqHeaders() {
  return { 'X-API-Key': process.env.TWITTERAPI_IO_KEY ?? '' }
}

export interface TAIOUser {
  id:         string
  username:   string
  name:       string
  followers?: number
  avatarUrl?: string
}

function mapTweet(raw: any): Tweet {
  return {
    id:         String(raw.id ?? raw.tweet_id ?? ''),
    text:       raw.text ?? '',
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    author_id:  String(raw.author?.id ?? raw.authorId ?? raw.userId ?? ''),
    public_metrics: {
      like_count:       raw.likeCount     ?? raw.like_count     ?? 0,
      retweet_count:    raw.retweetCount  ?? raw.retweet_count  ?? 0,
      reply_count:      raw.replyCount    ?? raw.reply_count    ?? 0,
      quote_count:      raw.quoteCount    ?? raw.quote_count    ?? 0,
      impression_count: raw.viewCount     ?? raw.view_count     ?? 0,
      bookmark_count:   raw.bookmarkCount ?? raw.bookmark_count ?? 0,
    },
    possibly_sensitive: raw.possiblySensitive ?? raw.possibly_sensitive ?? false,
    lang: raw.lang,
    referenced_tweets: raw.referencedTweets ?? raw.referenced_tweets,
  }
}

export async function getUserInfoById(userId: string): Promise<TAIOUser> {
  const res = await fetch(
    `${BASE}/twitter/user/info?userId=${encodeURIComponent(userId)}`,
    { headers: reqHeaders() }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TwitterAPI.io /user/info failed: ${res.status} ${err}`)
  }
  const d = await res.json()
  return {
    id:        String(d.id ?? d.userId ?? userId),
    username:  d.userName ?? d.username ?? '',
    name:      d.name ?? '',
    followers: d.followers ?? d.followersCount,
    avatarUrl: d.profilePicture ?? d.profile_image_url,
  }
}

export async function getUserTweets(
  userId:  string,
  cursor?: string
): Promise<{ tweets: Tweet[]; hasNextPage: boolean; nextCursor?: string }> {
  const params = new URLSearchParams({ userId })
  if (cursor) params.set('cursor', cursor)

  const res = await fetch(`${BASE}/twitter/user/last_tweets?${params}`, {
    headers: reqHeaders(),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TwitterAPI.io /user/last_tweets failed: ${res.status} ${err}`)
  }
  const data = await res.json()
  return {
    tweets:      (data.tweets ?? []).map(mapTweet),
    hasNextPage: data.has_next_page ?? false,
    nextCursor:  data.next_cursor,
  }
}

export async function getTweetById(tweetId: string): Promise<Tweet | null> {
  const res = await fetch(
    `${BASE}/twitter/tweet/detail?tweet_id=${encodeURIComponent(tweetId)}`,
    { headers: reqHeaders() }
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TwitterAPI.io /tweet/detail failed: ${res.status} ${err}`)
  }
  const data = await res.json()
  const raw  = data.tweet ?? data
  if (!raw?.id && !raw?.tweet_id) return null
  return mapTweet(raw)
}
