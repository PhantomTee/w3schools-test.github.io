import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session.user?.walletAddress) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: session.user.walletAddress },
    select: {
      walletAddress:  true,
      xUserId:        true,
      xUsername:      true,
      xConnectedAt:   true,
      xAvatarUrl:     true,
      xFollowerCount: true,
      _count: { select: { markets: true } },
    },
  })

  if (!user) return NextResponse.json({ user: null })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const marketsToday = await prisma.market.count({
    where: { creatorWallet: user.walletAddress, createdAt: { gte: todayStart } },
  })

  return NextResponse.json({
    user: {
      walletAddress:       user.walletAddress,
      xUserId:             user.xUserId,
      xUsername:           user.xUsername,
      xConnectedAt:        user.xConnectedAt?.toISOString() ?? null,
      xAvatarUrl:          user.xAvatarUrl,
      xFollowerCount:      user.xFollowerCount,
      marketsCreatedToday: marketsToday,
      totalMarketsCreated: user._count.markets,
    },
  })
}
