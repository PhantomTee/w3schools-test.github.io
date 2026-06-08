/**
 * Market resolution logic: fetches final X API metrics, determines winning range,
 * calls on-chain resolver, handles GenLayer dispute fallback.
 */
import { prisma } from './prisma'
import { getTweetById, normalizeTweetMetrics } from './x-api'
import { resolveDispute } from './genlayer'
import { resolveMarketOnChain, voidMarketOnChain } from './arc-contracts'
import { metricField } from './utils'
import type { Market, Range } from '@/types/market'

export async function attemptMarketResolution(market: Market): Promise<void> {
  const dbMarket = await prisma.market.findUniqueOrThrow({ where: { id: market.id } })
  if (dbMarket.state !== 'OPEN' && dbMarket.state !== 'LOCKED') return

  // Get the creator's access token for X API
  const creator = await prisma.user.findUnique({ where: { walletAddress: market.creatorWallet } })
  if (!creator?.xAccessToken || !creator.xUserId) {
    await voidAndRecord(market, 'Creator X account disconnected')
    return
  }

  const { decrypt } = await import('./crypto')
  const accessToken = decrypt(creator.xAccessToken)

  let finalValue: number | null = null
  let xApiFailed = false

  try {
    const tweet = await getTweetById(market.tweetId, accessToken)
    if (!tweet) {
      await voidAndRecord(market, 'Tweet deleted or unavailable')
      return
    }
    const metrics    = normalizeTweetMetrics(tweet)
    const field      = metricField(market.metricType as Market['metricType'])
    finalValue       = (metrics as Record<string, number | null>)[field.replace('_count', '').replace('impression', 'views')] ?? null

    // Map back from normalisedMetrics fields
    if (market.metricType === 'FINAL_VIEWS')   finalValue = metrics.views
    if (market.metricType === 'FINAL_LIKES')   finalValue = metrics.likes
    if (market.metricType === 'FINAL_REPOSTS') finalValue = metrics.reposts
    if (market.metricType === 'FINAL_REPLIES') finalValue = metrics.replies

  } catch (e) {
    console.error(`X API failed for market ${market.id}:`, e)
    xApiFailed = true
  }

  const ranges = market.ranges as Range[]

  // Try to find winning range deterministically
  if (finalValue != null) {
    const idx = findWinningRange(ranges, finalValue)
    if (idx >= 0) {
      await resolveAndRecord(market, idx, finalValue, 'X_API')
      return
    }
  }

  // Fall back to GenLayer
  try {
    const snapshots = await getSnapshots(market.id)
    const result = await resolveDispute({
      tweetId:       market.tweetId,
      metricType:    market.metricType as Market['metricType'],
      ranges,
      startValue:    Number(market.startValue),
      marketEndTime: market.expiresAt,
      xApiResult:    finalValue ?? undefined,
      snapshots,
      disputeReason: xApiFailed ? 'X API unavailable at expiry' : 'Boundary ambiguity',
    })

    if (result.status === 'resolved' && result.winningRangeIndex != null && result.finalValue != null) {
      await resolveAndRecord(market, result.winningRangeIndex, result.finalValue, 'GENLAYER')
      return
    }
  } catch (e) {
    console.error(`GenLayer fallback failed for market ${market.id}:`, e)
  }

  // Last resort: void
  await voidAndRecord(market, 'Final value could not be verified via X API or GenLayer')
}

function findWinningRange(ranges: Range[], value: number): number {
  return ranges.findIndex((r, i) => {
    if (r.maxOpen) return value >= r.min
    return value >= r.min && value < (r.max as number)
  })
}

async function resolveAndRecord(
  market:   Market,
  rangeIdx: number,
  value:    number,
  source:   'X_API' | 'GENLAYER'
) {
  const evidenceData = JSON.stringify({ source, finalValue: value, rangeIndex: rangeIdx, resolvedAt: new Date().toISOString() })

  let txHash: string | null = null
  if (market.contractAddress) {
    try {
      txHash = await resolveMarketOnChain(market.contractAddress, rangeIdx, BigInt(value), evidenceData)
    } catch (e) {
      console.error(`On-chain resolution failed for market ${market.id}:`, e)
      // Still record in DB; operator can retry
    }
  }

  await prisma.$transaction([
    prisma.market.update({
      where: { id: market.id },
      data:  {
        state:            'RESOLVED',
        finalValue:       BigInt(value),
        winningRangeIndex: rangeIdx,
        resolutionTxHash:  txHash,
        evidenceHash:      evidenceData,
      },
    }),
    prisma.resolutionAttempt.create({
      data: {
        marketId:          market.id,
        source,
        status:            'SUCCESS',
        finalValue:        BigInt(value),
        winningRangeIndex: rangeIdx,
        evidenceJson:      { source, finalValue: value, rangeIndex: rangeIdx },
      },
    }),
  ])
}

async function voidAndRecord(market: Market, reason: string) {
  let txHash: string | null = null
  if (market.contractAddress) {
    try {
      txHash = await voidMarketOnChain(market.contractAddress, reason)
    } catch (e) {
      console.error(`On-chain void failed for market ${market.id}:`, e)
    }
  }

  await prisma.$transaction([
    prisma.market.update({
      where: { id: market.id },
      data:  { state: 'VOIDED', resolutionTxHash: txHash, evidenceHash: reason },
    }),
    prisma.resolutionAttempt.create({
      data: {
        marketId: market.id,
        source:   'X_API',
        status:   'VOIDED',
        error:    reason,
      },
    }),
  ])
}

async function getSnapshots(marketId: string) {
  const attempts = await prisma.resolutionAttempt.findMany({
    where:   { marketId },
    orderBy: { createdAt: 'asc' },
  })
  return attempts
    .filter(a => a.finalValue != null)
    .map(a => ({
      timestamp: a.createdAt.toISOString(),
      value:     Number(a.finalValue),
    }))
}
