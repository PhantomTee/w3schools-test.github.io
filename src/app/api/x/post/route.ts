import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { postTweet } from '@/lib/x-api'
import { decrypt } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  let sessionUser
  try {
    sessionUser = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { walletAddress: sessionUser.walletAddress },
  })

  if (!user.xAccessToken) {
    return NextResponse.json({ error: 'X not connected' }, { status: 403 })
  }

  const { text } = await req.json()
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  if (text.length > 280) {
    return NextResponse.json({ error: 'text exceeds 280 characters' }, { status: 400 })
  }

  const { id } = await postTweet(text.trim(), decrypt(user.xAccessToken))
  return NextResponse.json({ success: true, tweetId: id })
}
