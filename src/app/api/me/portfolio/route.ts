import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ totalStaked: '0' })
  }

  try {
    const activeBets = await prisma.bet.findMany({
      where: {
        walletAddress: user.walletAddress,
        claimed:       false,
        market:        { state: { in: ['OPEN', 'LOCKED'] } },
      },
      select: { amount: true },
    })

    const totalStaked = activeBets.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalUsdc   = (totalStaked / 1_000_000).toFixed(2)

    return NextResponse.json({ totalStaked: totalUsdc })
  } catch {
    return NextResponse.json({ totalStaked: '0' })
  }
}
