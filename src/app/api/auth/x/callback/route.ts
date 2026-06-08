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

  const session = await getSession()

  // Verify state
  if (session.xOAuthState !== state) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_state_mismatch`)
  }

  if (!session.user?.walletAddress) {
    return NextResponse.redirect(`${appUrl}/profile?error=wallet_not_connected`)
  }

  // Look up code verifier from DB (belt-and-suspenders with session)
  const oauthRecord = await prisma.xOAuthState.findUnique({ where: { state } })
  if (!oauthRecord || oauthRecord.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_state_expired`)
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
    return NextResponse.redirect(`${appUrl}/profile?error=x_userinfo_failed`)
  }

  // Check xUserId not already connected to another wallet
  const existing = await prisma.user.findUnique({ where: { xUserId: xUser.id } })
  if (existing && existing.walletAddress !== session.user.walletAddress) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_already_connected`)
  }

  const now = new Date()
  await prisma.user.update({
    where: { walletAddress: session.user.walletAddress },
    data:  {
      xUserId:         xUser.id,
      xUsername:       xUser.username,
      xConnectedAt:    existing?.xConnectedAt ?? now, // preserve original connection time
      xAccessToken:    encrypt(tokens.accessToken),
      xRefreshToken:   encrypt(tokens.refreshToken),
      xTokenExpiresAt: tokens.expiresAt,
    },
  })

  // Clean up OAuth state
  await prisma.xOAuthState.delete({ where: { state } }).catch(() => {})

  session.user = {
    ...session.user,
    xUserId:      xUser.id,
    xUsername:    xUser.username,
    xConnectedAt: (existing?.xConnectedAt ?? now).toISOString(),
  }
  session.xOAuthState        = undefined
  session.xOAuthCodeVerifier = undefined
  await session.save()

  return NextResponse.redirect(`${appUrl}/profile?connected=1`)
}
