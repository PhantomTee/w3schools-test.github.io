/**
 * Start X OAuth 2.0 PKCE flow.
 * GET /api/auth/x/connect
 * Requires wallet session.
 */
import { NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
  getOAuthUrl,
} from '@/lib/x-api'

export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 })
  }

  const codeVerifier    = generateCodeVerifier()
  const codeChallenge   = generateCodeChallenge(codeVerifier)
  const state           = generateOAuthState()

  // Store state + verifier so callback can verify
  await prisma.xOAuthState.create({
    data: {
      walletAddress: user.walletAddress,
      state,
      codeVerifier,
      expiresAt: new Date(Date.now() + 10 * 60_000), // 10 min
    },
  })

  const session = await getSession()
  session.xOAuthState        = state
  session.xOAuthCodeVerifier = codeVerifier
  await session.save()

  const url = getOAuthUrl(state, codeChallenge)
  return NextResponse.redirect(url)
}
