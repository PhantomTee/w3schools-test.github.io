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
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProfileContent() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const xError     = searchParams.get('error')
  const xConnected = searchParams.get('connected') === '1'

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
        <h1 className="text-[36px] text-[var(--text-primary)] mb-1 leading-tight">Profile</h1>
        <p className="text-[18px] text-[var(--text-muted)] mb-6">Your account and activity on Xen.</p>

        {xConnected && (
          <div className="mb-4 px-4 py-3 border-2 border-[var(--ink)] rounded-[4px] text-[16px] text-[var(--text-primary)]">
            X account connected successfully.
          </div>
        )}
        {xError && (
          <div className="mb-4 px-4 py-3 border-2 border-[var(--xen-red)] rounded-[4px] text-[16px] text-[var(--xen-red)]">
            {X_ERROR_MESSAGES[xError] ?? `Connection failed: ${xError}`}
          </div>
        )}

        {/* Identity card */}
        <div className="sketch-card p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[26px] text-[var(--text-primary)] leading-tight">
                {user?.xUsername ? `@${user.xUsername}` : 'No X connected'}
              </p>
              {address && (
                <p className="text-[15px] text-[var(--text-muted)] font-mono mt-1">{truncateAddr(address)}</p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              {user?.xUsername ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />
                  <span className="text-[15px] text-[var(--text-primary)]">X connected</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
                  <span className="text-[15px] text-[var(--text-muted)]">X not connected</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="sketch-panel p-3">
              <p className="text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Markets today</p>
              <p className="text-[28px] text-[var(--text-primary)] tabular-nums leading-none">
                {user?.marketsCreatedToday ?? '—'}
              </p>
            </div>
            <div className="sketch-panel p-3">
              <p className="text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total markets</p>
              <p className="text-[28px] text-[var(--text-primary)] tabular-nums leading-none">
                {user?.totalMarketsCreated ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* X Account */}
        <div className="sketch-card p-5 mb-4">
          <p className="text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-4">X Account</p>
          {user?.xUsername ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[20px] text-[var(--text-primary)]">@{user.xUsername}</p>
                {user.xConnectedAt && (
                  <p className="text-[15px] text-[var(--text-muted)] mt-0.5">
                    Connected {formatDate(user.xConnectedAt)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--xen-red)] hover:text-[var(--xen-red)] text-[16px]"
                onClick={handleDisconnectX}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-[17px] text-[var(--text-muted)] mb-4">
                Connect your X account to create markets from your tweets.
              </p>
              <a href="/api/auth/x/connect">
                <Button variant="filled" size="sm">Connect X</Button>
              </a>
            </div>
          )}
        </div>

        {/* Wallet */}
        <div className="sketch-card p-5 mb-4">
          <p className="text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-4">Wallet</p>
          {isConnected && address ? (
            <div>
              <p className="text-[15px] text-[var(--text-primary)] font-mono break-all">{address}</p>
              <p className="text-[15px] text-[var(--text-muted)] mt-2">Connected via wallet signature</p>
            </div>
          ) : (
            <p className="text-[17px] text-[var(--text-muted)]">No wallet connected.</p>
          )}
        </div>

        {/* Your Markets */}
        <div className="sketch-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-[var(--text-muted)] uppercase tracking-wider">Your Markets</p>
            <Link href="/create">
              <Button variant="xen" size="sm">Create new</Button>
            </Link>
          </div>
          <p className="text-[17px] text-[var(--text-muted)] leading-relaxed">
            Your created markets will appear here. Head to the{' '}
            <Link href="/markets" className="text-[var(--text-primary)] underline underline-offset-4">
              Markets page
            </Link>
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
