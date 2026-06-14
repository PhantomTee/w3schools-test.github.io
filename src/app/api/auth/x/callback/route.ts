/**
 * X OAuth 2.0 callback handler.
 * GET /api/auth/x/callback?code=...&state=...
 *
 * Identity strategy (no official X API calls needed):
 *   1. Token exchange returns an OIDC id_token (openid scope).
 *   2. Decode id_token JWT → sub = X user ID.
 *   3. Call TwitterAPI.io to get username from user ID.
 * This avoids the /2/users/me call that requires being in an X Project.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { exchangeCodeForTokens, decodeIdToken } from '@/lib/x-api'
import { getUserInfoById } from '@/lib/twitterapiio'
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

  // DB record is more reliable than session cookie (Safari can drop cookies
  // across a cross-site redirect to x.com and back).
  const oauthRecord = await prisma.xOAuthState.findUnique({ where: { state } })
  if (!oauthRecord || oauthRecord.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/profile?error=x_state_expired`)
  }

  const session       = await getSession()
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

  // Extract X user ID from the OIDC id_token (no API call required).
  const xUserId = tokens.idToken ? decodeIdToken(tokens.idToken) : null
  if (!xUserId) {
    const detail = encodeURIComponent('id_token missing — ensure openid scope is granted and the app is configured correctly.')
    return NextResponse.redirect(`${appUrl}/profile?error=x_userinfo_failed&detail=${detail}`)
  }

  // Resolve username via TwitterAPI.io (does not require X Project access).
  let xUser: { id: string; username: string; avatarUrl?: string; followers?: number }
  try {
    const info = await getUserInfoById(xUserId)
    xUser = { id: xUserId, username: info.username, avatarUrl: info.avatarUrl, followers: info.followers }
  } catch (e) {
    console.error('TwitterAPI.io user info error:', e)
    const detail = encodeURIComponent((e as Error).message.slice(0, 160))
    return NextResponse.redirect(`${appUrl}/profile?error=x_userinfo_failed&detail=${detail}`)
  }

  // Ensure this X account isn't already linked to a different wallet.
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
      xAvatarUrl:      xUser.avatarUrl ?? null,
      xFollowerCount:  xUser.followers ?? null,
    },
  })

  await prisma.xOAuthState.delete({ where: { state } }).catch(() => {})

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
