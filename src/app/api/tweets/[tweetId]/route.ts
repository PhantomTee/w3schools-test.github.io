import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getTweetById, normalizeTweetMetrics, isTweetEligible } from '@/lib/x-api'
import { decrypt } from '@/lib/crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: { tweetId: string } }
) {
  let sessionUser
  try {
    sessionUser = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { walletAddress: sessionUser.walletAddress },
  })

  if (!user.xUserId || !user.xAccessToken || !user.xConnectedAt) {
    return NextResponse.json({ error: 'X not connected' }, { status: 403 })
  }

  const tweet = await getTweetById(params.tweetId, decrypt(user.xAccessToken))
  if (!tweet) {
    return NextResponse.json({ error: 'Tweet not found' }, { status: 404 })
  }

  const { eligible, reason } = isTweetEligible(tweet, new Date(user.xConnectedAt))
  const metrics              = normalizeTweetMetrics(tweet)

  const activeMarkets = await prisma.market.count({
    where: { tweetId: params.tweetId, state: { in: ['OPEN', 'LOCKED'] } },
  })

  return NextResponse.json({
    tweet:   { ...tweet, normalizedMetrics: metrics, eligible, eligibilityNote: reason, activeMarketCount: activeMarkets },
  })
}
