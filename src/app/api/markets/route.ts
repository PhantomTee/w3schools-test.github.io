/**
 * GET /api/markets  – list markets (trending, live, ending soon, resolved)
 * POST /api/markets – record market after on-chain tx confirmed
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter   = searchParams.get('filter') ?? 'live'  // live|ending|resolved|all
  const metric   = searchParams.get('metric')
  const page     = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 20

  const where: Record<string, unknown> = {}

  if (metric) where.metricType = metric

  switch (filter) {
    case 'live':
      where.state    = 'OPEN'
      break
    case 'ending':
      where.state    = 'OPEN'
      where.expiresAt = { lte: new Date(Date.now() + 3 * 60 * 60 * 1000) }
      break
    case 'resolved':
      where.state    = 'RESOLVED'
      break
    case 'all':
      break
  }

  const [markets, total] = await Promise.all([
    prisma.market.findMany({
      where,
      orderBy: filter === 'resolved' ? { expiresAt: 'desc' } : { totalStaked: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        creator: { select: { xUsername: true } },
        bets:    { select: { walletAddress: true, rangeIndex: true, amount: true } },
      },
    }),
    prisma.market.count({ where }),
  ])

  const formatted = markets.map(m => ({
    id:               m.id,
    chainMarketId:    m.chainMarketId,
    contractAddress:  m.contractAddress,
    creatorWallet:    m.creatorWallet,
    xUsername:        m.creator.xUsername,
    tweetId:          m.tweetId,
    metricType:       m.metricType,
    startValue:       m.startValue.toString(),
    finalValue:       m.finalValue?.toString() ?? null,
    durationHours:    m.durationHours,
    createdAt:        m.createdAt.toISOString(),
    expiresAt:        m.expiresAt.toISOString(),
    state:            m.state,
    ranges:           m.rangesJson,
    winningRangeIndex: m.winningRangeIndex,
    totalStaked:      m.totalStaked.toString(),
    pools:            buildPools(m.bets),
  }))

  return NextResponse.json({ markets: formatted, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.user?.walletAddress) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { marketDbId, chainMarketId, contractAddress, txHash } = await req.json()

  const market = await prisma.market.findUnique({ where: { id: marketDbId } })
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.creatorWallet !== session.user.walletAddress) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.market.update({
    where: { id: marketDbId },
    data:  {
      chainMarketId:   String(chainMarketId),
      contractAddress: contractAddress.toLowerCase(),
      creationTxHash:  txHash,
    },
  })

  return NextResponse.json({ market: { id: updated.id, contractAddress: updated.contractAddress } })
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
