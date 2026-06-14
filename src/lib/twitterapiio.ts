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
  // Batch endpoint accepts a single ID too — cheapest per-call option for lookups.
  const res = await fetch(
    `${BASE}/twitter/user/batch_info_by_ids?userIds=${encodeURIComponent(userId)}`,
    { headers: reqHeaders() }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TwitterAPI.io /user/batch_info_by_ids failed: ${res.status} ${err}`)
  }
  const data = await res.json()
  // Response: { users: [{ id, userName, name, profilePicture, followers, ... }] }
  const d = (data.users ?? data)[0]
  if (!d) throw new Error('TwitterAPI.io: no user found for id ' + userId)
  return {
    id:        String(d.id ?? userId),
    username:  d.userName ?? '',
    name:      d.name ?? '',
    followers: d.followers,
    avatarUrl: d.profilePicture,
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
  // Bulk tweets endpoint accepts a single ID too.
  const res = await fetch(
    `${BASE}/twitter/tweets?tweet_ids=${encodeURIComponent(tweetId)}`,
    { headers: reqHeaders() }
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TwitterAPI.io /tweets failed: ${res.status} ${err}`)
  }
  const data = await res.json()
  // Response: { tweets: [...] } or array directly
  const tweets = data.tweets ?? (Array.isArray(data) ? data : [])
  if (!tweets.length) return null
  return mapTweet(tweets[0])
}
