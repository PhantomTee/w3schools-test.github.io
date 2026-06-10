'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

const X_ERROR_MESSAGES: Record<string, string> = {
  x_denied:              'You cancelled the X authorization.',
  x_state_mismatch:      'OAuth state mismatch — try connecting again.',
  x_state_expired:       'Authorization expired — try connecting again.',
  x_token_exchange_failed: 'Failed to exchange tokens with X. Check your X app credentials.',
  x_userinfo_failed:     'Connected but could not fetch your X profile.',
  x_already_connected:   'This X account is already linked to a different wallet.',
  x_invalid_callback:    'Invalid OAuth callback — try connecting again.',
  wallet_not_connected:  'Sign in with your wallet first, then connect X.',
}

function truncateAddr(addr: string) {
  if (!addr) return ''
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProfileContent() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const xError       = searchParams.get('error')
  const xErrorDetail = searchParams.get('detail')
  const xConnected   = searchParams.get('connected') === '1'

  const { data: meData } = useQuery({
    queryKey:  ['me'],
    queryFn:   () => fetch('/api/auth/me').then(r => r.json()),
    staleTime: 60_000,
  })
  const user = meData?.user

  async function handleDisconnectX() {
    await fetch('/api/auth/x', { method: 'DELETE' })
    queryClient.invalidateQueries({ queryKey: ['me'] })
  }

  return (
    <AppShell>
      <div className="max-w-[600px] mx-auto px-4 pt-6 pb-10">
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] mb-1">Profile</h1>
        <p className="text-[14px] text-[var(--text-muted)] mb-6">Your account and activity on Xen.</p>

        {xConnected && (
          <div className="mb-4 px-4 py-3 rounded-[12px] bg-[var(--xen-green)]/10 border border-[var(--xen-green)]/30 text-[14px] text-[var(--xen-green)]">
            X account connected successfully.
          </div>
        )}
        {xError && (
          <div className="mb-4 px-4 py-3 rounded-[12px] bg-[var(--xen-red)]/10 border border-[var(--xen-red)]/30 text-[14px] text-[var(--xen-red)]">
            <p>{X_ERROR_MESSAGES[xError] ?? `Connection failed: ${xError}`}</p>
            {xErrorDetail && (
              <p className="mt-1 text-[12px] break-all opacity-80">{xErrorDetail}</p>
            )}
          </div>
        )}

        {/* Profile header */}
        <div className="bg-[var(--bg-elevated)] rounded-[20px] p-5 border border-[var(--border-soft)] mb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {user?.xAvatarUrl ? (
                <img
                  src={user.xAvatarUrl}
                  alt="X avatar"
                  className="h-12 w-12 rounded-full object-cover border border-[var(--border-soft)] shrink-0"
                />
              ) : (
                <span className="h-12 w-12 rounded-full bg-[var(--bg-muted)] border border-[var(--border-soft)] shrink-0 flex items-center justify-center text-[20px] text-[var(--text-muted)]">
                  {user?.xUsername ? user.xUsername[0].toUpperCase() : '?'}
                </span>
              )}
              <div>
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">
                  {user?.xUsername ? `@${user.xUsername}` : 'No X connected'}
                </p>
                {address && (
                  <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">{truncateAddr(address)}</p>
                )}
                {user?.xFollowerCount != null && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                    {user.xFollowerCount.toLocaleString()} followers
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              {user?.xUsername ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--xen-green)]" />
                  <span className="text-[11px] text-[var(--xen-green)]">X connected</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
                  <span className="text-[11px] text-[var(--text-muted)]">X not connected</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-muted)] rounded-[12px] p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Markets today</p>
              <p className="text-[18px] font-semibold text-[var(--text-primary)] tabular-nums">
                {user?.marketsCreatedToday ?? '—'}
              </p>
            </div>
            <div className="bg-[var(--bg-muted)] rounded-[12px] p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total markets</p>
              <p className="text-[18px] font-semibold text-[var(--text-primary)] tabular-nums">
                {user?.totalMarketsCreated ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* X Account */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">X Account</p>
          {user?.xUsername ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-[var(--text-primary)]">@{user.xUsername}</p>
                {user.xConnectedAt && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Connected {formatDate(user.xConnectedAt)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--xen-red)]/70 hover:text-[var(--xen-red)]"
                onClick={handleDisconnectX}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-[var(--text-muted)] mb-3">
                Connect your X account to create markets from your tweets.
              </p>
              <a href="/api/auth/x/connect">
                <Button variant="xen" size="sm">Connect X</Button>
              </a>
            </div>
          )}
        </div>

        {/* Wallet */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Wallet</p>
          {isConnected && address ? (
            <div>
              <p className="text-[12px] text-[var(--text-secondary)] font-mono break-all">{address}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Connected via wallet</p>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)]">No wallet connected.</p>
          )}
        </div>

        {/* Your Markets */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Your Markets</p>
            <Link href="/create">
              <Button variant="outline" size="sm" className="text-[12px]">Create new</Button>
            </Link>
          </div>
          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            Your created markets will appear here. Head to the{' '}
            <Link href="/markets" className="text-[var(--accent-primary)] hover:underline">Markets page</Link>
            {' '}to browse all open markets.
          </p>
        </div>
      </div>
    </AppShell>
  )
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  )
}
