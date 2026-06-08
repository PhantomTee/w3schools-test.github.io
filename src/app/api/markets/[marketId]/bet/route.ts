/**
 * POST /api/markets/[marketId]/bet
 * Records a bet after the on-chain transaction is confirmed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { marketId: string } }
) {
  const session = await getSession()
  if (!session.user?.walletAddress) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rangeIndex, amount, txHash } = await req.json()

  if (typeof rangeIndex !== 'number' || rangeIndex < 0)
    return NextResponse.json({ error: 'Invalid rangeIndex' }, { status: 400 })
  if (!amount || BigInt(amount) <= 0n)
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const market = await prisma.market.findUnique({ where: { id: params.marketId } })
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })

  if (market.state !== 'OPEN')
    return NextResponse.json({ error: 'Market not open' }, { status: 409 })
  if (new Date() >= market.expiresAt)
    return NextResponse.json({ error: 'Market expired' }, { status: 409 })
  if (market.creatorWallet === session.user.walletAddress)
    return NextResponse.json({ error: 'Creator cannot bet on own market' }, { status: 403 })

  const amountBig = BigInt(amount)

  const [bet] = await prisma.$transaction([
    prisma.bet.create({
      data: {
        marketId:     params.marketId,
        walletAddress: session.user.walletAddress,
        rangeIndex,
        amount:       amountBig,
        txHash,
      },
    }),
    prisma.market.update({
      where: { id: params.marketId },
      data:  { totalStaked: { increment: amountBig } },
    }),
  ])

  return NextResponse.json({ bet: { id: bet.id, rangeIndex, amount: amountBig.toString() } })
}
