import { NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  let sessionUser
  try {
    sessionUser = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.user.update({
    where: { walletAddress: sessionUser.walletAddress },
    data: {
      xUserId:         null,
      xUsername:       null,
      xConnectedAt:    null,
      xAccessToken:    null,
      xRefreshToken:   null,
      xTokenExpiresAt: null,
    },
  })

  const session = await getSession()
  if (session.user) {
    session.user = {
      walletAddress: session.user.walletAddress,
    }
    await session.save()
  }

  return NextResponse.json({ success: true })
}
