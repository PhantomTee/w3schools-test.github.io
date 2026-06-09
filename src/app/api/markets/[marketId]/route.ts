import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: { marketId: string } }
) {
  const market = await prisma.market.findUnique({
    where:   { id: params.marketId },
    include: {
      creator:       { select: { xUsername: true, walletAddress: true } },
      bets:          { orderBy: { createdAt: 'desc' } },
      tweetSnapshot: { select: { text: true } },
    },
  })

  if (!market) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const session = await getSession()
  const userAddress = session.user?.walletAddress

  const pools = buildPools(market.bets)
  const userStakes = userAddress
    ? market.bets
        .filter(b => b.walletAddress === userAddress)
        .map(b => ({ rangeIndex: b.rangeIndex, amount: b.amount.toString(), claimed: b.claimed }))
    : []

  return NextResponse.json({
    market: {
      id:               market.id,
      chainMarketId:    market.chainMarketId,
      contractAddress:  market.contractAddress,
      creatorWallet:    market.creatorWallet,
      xUsername:        market.creator.xUsername,
      tweetId:          market.tweetId,
      tweetText:        market.tweetSnapshot?.text ?? null,
      metricType:       market.metricType,
      startValue:       market.startValue.toString(),
      finalValue:       market.finalValue?.toString() ?? null,
      durationHours:    market.durationHours,
      createdAt:        market.createdAt.toISOString(),
      expiresAt:        market.expiresAt.toISOString(),
      state:            market.state,
      ranges:           market.rangesJson,
      winningRangeIndex: market.winningRangeIndex,
      totalStaked:      market.totalStaked.toString(),
      pools,
      userStakes,
      genLayerReportHash:   market.genLayerReportHash,
      genLayerReport:       market.genLayerResponseJson ?? null,
      recentBets:           market.bets.slice(0, 20).map(b => ({
        walletAddress: b.walletAddress,
        rangeIndex:    b.rangeIndex,
        amount:        b.amount.toString(),
        createdAt:     b.createdAt.toISOString(),
      })),
    },
  })
}

function buildPools(bets: Array<{ rangeIndex: number; amount: bigint }>) {
  const map = new Map<number, bigint>()
  for (const b of bets) {
    map.set(b.rangeIndex, (map.get(b.rangeIndex) ?? 0n) + b.amount)
  }
  return Array.from(map.entries()).map(([rangeIndex, amount]) => ({
    rangeIndex,
    amount: amount.toString(),
  }))
}
