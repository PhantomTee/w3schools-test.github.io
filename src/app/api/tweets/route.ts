/**
 * GET /api/tweets
 * Returns the authenticated creator's recent eligible tweets via TwitterAPI.io.
 * Requires wallet + X session (xUserId in DB).
 */
import { NextResponse } from 'next/server'
import { requireXAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getUserTweets as getViaScaper } from '@/lib/twitterapiio'
import { enrichTweets } from '@/lib/x-api'

export async function GET() {
  let sessionUser
  try {
    sessionUser = await requireXAuth()
  } catch (e) {
    const msg    = (e as Error).message
    const status = msg === 'UNAUTHORIZED' ? 401 : 403
    return NextResponse.json({ error: msg }, { status })
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { walletAddress: sessionUser.walletAddress },
  })

  if (!user.xUserId || !user.xConnectedAt) {
    return NextResponse.json({ error: 'X account not fully connected' }, { status: 403 })
  }

  let tweets
  try {
    const result = await getViaScaper(user.xUserId)
    tweets = result.tweets
  } catch (e) {
    return NextResponse.json({ error: `Tweet fetch error: ${(e as Error).message}` }, { status: 502 })
  }

  // Filter to only tweets after xConnectedAt
  const connectedAt = new Date(user.xConnectedAt)
  const filtered    = tweets.filter(t => new Date(t.created_at) >= connectedAt)

  // Get active market counts per tweet
  const tweetIds    = filtered.map(t => t.id)
  const marketCounts = await prisma.market.groupBy({
    by:     ['tweetId'],
    where:  { tweetId: { in: tweetIds }, state: { in: ['OPEN', 'LOCKED'] } },
    _count: { id: true },
  })
  const activeMap = new Map(marketCounts.map(m => [m.tweetId, m._count.id]))

  const enriched = enrichTweets(filtered, connectedAt, activeMap)

  // Sort: eligible first, then by newest
  enriched.sort((a, b) => {
    if (a.eligible && !b.eligible) return -1
    if (!a.eligible && b.eligible) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return NextResponse.json({ tweets: enriched })
}
