/**
 * POST /api/genlayer/design
 * Calls GenLayer Market Designer to generate ranges for a tweet metric.
 * Returns ranges + report hash for inclusion in signed MarketConfig.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireXAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getTweetById, normalizeTweetMetrics, isTweetEligible } from '@/lib/x-api'
import { designMarket } from '@/lib/genlayer'
import { decrypt } from '@/lib/crypto'
import { tweetAgeMinutes } from '@/lib/utils'
import type { MetricType } from '@/types/market'

export async function POST(req: NextRequest) {
  let sessionUser
  try {
    sessionUser = await requireXAuth()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 })
  }

  const { tweetId, metricType, durationHours } = await req.json() as {
    tweetId:       string
    metricType:    MetricType
    durationHours: number
  }

  const validDurations = [1, 3, 6, 12, 24, 48]
  if (!validDurations.includes(durationHours))
    return NextResponse.json({ error: 'Invalid durationHours' }, { status: 400 })

  const validMetrics: MetricType[] = ['FINAL_VIEWS', 'FINAL_LIKES', 'FINAL_REPOSTS', 'FINAL_REPLIES']
  if (!validMetrics.includes(metricType))
    return NextResponse.json({ error: 'Invalid metricType' }, { status: 400 })

  const user = await prisma.user.findUniqueOrThrow({
    where: { walletAddress: sessionUser.walletAddress },
  })

  if (!user.xAccessToken || !user.xConnectedAt)
    return NextResponse.json({ error: 'X not connected' }, { status: 403 })

  const tweet = await getTweetById(tweetId, decrypt(user.xAccessToken))
  if (!tweet) return NextResponse.json({ error: 'Tweet not found' }, { status: 404 })

  const { eligible, reason } = isTweetEligible(tweet, new Date(user.xConnectedAt))
  if (!eligible) return NextResponse.json({ error: reason ?? 'Tweet not eligible' }, { status: 422 })

  // Check duplicate: same tweet + metric + duration can't have 2 active markets
  const duplicate = await prisma.market.findFirst({
    where: {
      tweetId,
      metricType,
      durationHours,
      state: { in: ['OPEN', 'LOCKED'] },
    },
  })
  if (duplicate) {
    return NextResponse.json(
      { error: 'An active market already exists for this tweet, metric, and duration.' },
      { status: 409 }
    )
  }

  const metrics = normalizeTweetMetrics(tweet)

  // Views unavailable check
  if (metricType === 'FINAL_VIEWS' && metrics.views == null) {
    return NextResponse.json(
      {
        error:   'Views/impressions are not available from X API for this tweet/account. Try likes or reposts.',
        code:    'METRIC_UNAVAILABLE',
        metric:  metricType,
      },
      { status: 422 }
    )
  }

  let design
  try {
    design = await designMarket({
      tweetId,
      tweetText:       tweet.text,
      tweetCreatedAt:  tweet.created_at,
      currentMetrics:  metrics,
      metricType,
      durationHours,
      tweetAgeMinutes: tweetAgeMinutes(tweet.created_at),
    })
  } catch (e) {
    return NextResponse.json({ error: `GenLayer Designer error: ${(e as Error).message}` }, { status: 502 })
  }

  return NextResponse.json({ design })
}
