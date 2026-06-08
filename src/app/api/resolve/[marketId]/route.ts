/**
 * POST /api/resolve/[marketId]
 * Manually trigger resolution for a single market (admin/cron).
 * Requires RESOLVER_PRIVATE_KEY bearer token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { attemptMarketResolution } from '@/lib/market-resolver'

export async function POST(
  req: NextRequest,
  { params }: { params: { marketId: string } }
) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? process.env.RESOLVER_PRIVATE_KEY}`
  if (!auth || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const market = await prisma.market.findUnique({ where: { id: params.marketId } })
  if (!market) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (market.state !== 'OPEN' && market.state !== 'LOCKED') {
    return NextResponse.json({ message: 'Already settled', state: market.state })
  }

  if (new Date() < market.expiresAt) {
    return NextResponse.json({ error: 'Market not yet expired' }, { status: 409 })
  }

  try {
    await attemptMarketResolution({
      id:              market.id,
      contractAddress: market.contractAddress,
      creatorWallet:   market.creatorWallet,
      tweetId:         market.tweetId,
      metricType:      market.metricType as any,
      startValue:      market.startValue.toString(),
      finalValue:      null,
      expiresAt:       market.expiresAt.toISOString(),
      state:           market.state as any,
      ranges:          market.rangesJson as any,
      chainMarketId:   null,
      xUserIdHash:     market.xUserIdHash,
      durationHours:   market.durationHours,
      createdAt:       market.createdAt.toISOString(),
      genLayerReportHash: market.genLayerReportHash,
      creationTxHash:  market.creationTxHash,
      resolutionTxHash: null,
      evidenceHash:    null,
      winningRangeIndex: null,
      protocolFeeBps:  market.protocolFeeBps,
      totalStaked:     market.totalStaked.toString(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
