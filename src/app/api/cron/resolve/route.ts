/**
 * GET /api/cron/resolve
 * Cron job: resolves all expired markets that are still OPEN/LOCKED.
 * Call this from Vercel Cron or your own scheduler every 5 minutes.
 * Protected by CRON_SECRET header.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { attemptMarketResolution } from '@/lib/market-resolver'

export const maxDuration = 300 // 5 min (Vercel)
export const dynamic     = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (process.env.NODE_ENV === 'production' && auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expiredMarkets = await prisma.market.findMany({
    where: {
      state:     { in: ['OPEN', 'LOCKED'] },
      expiresAt: { lte: new Date() },
    },
    take: 50,
  })

  const results: Record<string, string> = {}

  for (const m of expiredMarkets) {
    try {
      await attemptMarketResolution({
        id:              m.id,
        contractAddress: m.contractAddress,
        creatorWallet:   m.creatorWallet,
        tweetId:         m.tweetId,
        metricType:      m.metricType as any,
        startValue:      m.startValue.toString(),
        finalValue:      null,
        expiresAt:       m.expiresAt.toISOString(),
        state:           m.state as any,
        ranges:          m.rangesJson as any,
        chainMarketId:   null,
        xUserIdHash:     m.xUserIdHash,
        durationHours:   m.durationHours,
        createdAt:       m.createdAt.toISOString(),
        genLayerReportHash: m.genLayerReportHash,
        creationTxHash:  m.creationTxHash,
        resolutionTxHash: null,
        evidenceHash:    null,
        winningRangeIndex: null,
        protocolFeeBps:  m.protocolFeeBps,
        totalStaked:     m.totalStaked.toString(),
      })
      results[m.id] = 'resolved'
    } catch (e) {
      results[m.id] = `error: ${(e as Error).message}`
    }
  }

  return NextResponse.json({
    processed: expiredMarkets.length,
    results,
  })
}
