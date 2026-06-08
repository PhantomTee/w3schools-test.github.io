import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionUser } from '@/types/user'

export interface SessionData {
  user?: SessionUser
  xOAuthState?: string
  xOAuthCodeVerifier?: string
  siweNonce?: string
}

export const SESSION_OPTIONS = {
  cookieName: 'xen-session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), SESSION_OPTIONS)
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session.user?.walletAddress) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user
}

export async function requireXAuth(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.xUserId) {
    throw new Error('X_NOT_CONNECTED')
  }
  return user
}
