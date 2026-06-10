/**
 * X OAuth 2.0 callback handler.
 * GET /api/auth/x/callback?code=...&state=...
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { exchangeCodeForTokens, getUserByMe } from '@/lib/x-api'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_invalid_callback`)
  }

  // Look up the OAuth record from DB first — more reliable than the session
  // cookie which can be dropped by Safari / strict browser settings during
  // a cross-site redirect to twitter.com and back.
  const oauthRecord = await prisma.xOAuthState.findUnique({ where: { state } })
  if (!oauthRecord || oauthRecord.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_state_expired`)
  }

  // Resolve the wallet address: prefer session (still valid in most browsers),
  // fall back to the value stored in the DB record when the session was created.
  const session = await getSession()
  const walletAddress = session.user?.walletAddress ?? oauthRecord.walletAddress

  if (!walletAddress) {
    return NextResponse.redirect(`${appUrl}/profile?error=wallet_not_connected`)
  }

  const codeVerifier = session.xOAuthCodeVerifier ?? oauthRecord.codeVerifier

  let tokens
  try {
    tokens = await exchangeCodeForTokens(code, codeVerifier)
  } catch (e) {
    console.error('X token exchange error:', e)
    return NextResponse.redirect(`${appUrl}/profile?error=x_token_exchange_failed`)
  }

  let xUser
  try {
    xUser = await getUserByMe(tokens.accessToken)
  } catch (e) {
    console.error('X /users/me error:', e)
    const detail = encodeURIComponent((e as Error).message.slice(0, 160))
    return NextResponse.redirect(`${appUrl}/profile?error=x_userinfo_failed&detail=${detail}`)
  }

  // Ensure this X account isn't already linked to a different wallet
  const existing = await prisma.user.findUnique({ where: { xUserId: xUser.id } })
  if (existing && existing.walletAddress !== walletAddress) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_already_connected`)
  }

  const now = new Date()
  await prisma.user.update({
    where: { walletAddress },
    data:  {
      xUserId:         xUser.id,
      xUsername:       xUser.username,
      xConnectedAt:    existing?.xConnectedAt ?? now,
      xAccessToken:    encrypt(tokens.accessToken),
      xRefreshToken:   encrypt(tokens.refreshToken),
      xTokenExpiresAt: tokens.expiresAt,
    },
  })

  await prisma.xOAuthState.delete({ where: { state } }).catch(() => {})

  // Refresh session with X data (best-effort — the DB is the source of truth)
  session.user = {
    ...(session.user ?? { walletAddress }),
    xUserId:      xUser.id,
    xUsername:    xUser.username,
    xConnectedAt: (existing?.xConnectedAt ?? now).toISOString(),
  }
  session.xOAuthState        = undefined
  session.xOAuthCodeVerifier = undefined
  await session.save()

  return NextResponse.redirect(`${appUrl}/profile?connected=1`)
}
