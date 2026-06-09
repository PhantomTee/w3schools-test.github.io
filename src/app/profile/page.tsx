'use client'
import { Suspense, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { TweetCard } from '@/components/tweets/TweetCard'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'

function ProfileNotifications() {
  const searchParams = useSearchParams()
  const connected    = searchParams.get('connected')
  const error        = searchParams.get('error')
  const qc           = useQueryClient()

  useEffect(() => {
    if (connected) qc.invalidateQueries({ queryKey: ['me'] })
  }, [connected, qc])

  if (!connected && !error) return null

  return (
    <>
      {connected && (
        <div className="p-4 rounded-[16px] bg-[#22C55E]/[0.08] border border-[#22C55E]/20 text-[#22C55E] text-[14px]">
          X account connected successfully.
        </div>
      )}
      {error && (
        <div className="p-4 rounded-[16px] bg-[#EF4444]/[0.08] border border-[#EF4444]/20 text-[#EF4444] text-[14px]">
          {error === 'x_denied'            ? 'X authorization was denied.' :
           error === 'x_already_connected' ? 'This X account is already connected to another wallet.' :
           `Error: ${error}`}
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
  })
  const me = meData?.user

  const { data: tweetsData, isLoading: tweetsLoading, refetch } = useQuery({
    queryKey:  ['my-tweets'],
    queryFn:   () => fetch('/api/tweets').then(r => r.json()),
    enabled:   !!me?.xUserId,
    staleTime: 60_000,
  })

  if (!me) {
    return (
      <AppShell>
        <div className="px-5 sm:px-8 py-16 max-w-2xl mx-auto text-center space-y-4">
          <p className="text-[32px] font-semibold text-[#F8FAFC]">Connect your wallet</p>
          <p className="text-[15px] text-[#64748B]">
            Sign in with your wallet to view your profile and create markets.
          </p>
        </div>
      </AppShell>
    )
  }

  const tweets = tweetsData?.tweets ?? []

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-4xl mx-auto space-y-8">

        <Suspense fallback={null}>
          <ProfileNotifications />
        </Suspense>

        {/* Profile card */}
        <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Wallet</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[14px] text-[#94A3B8]">{shortenAddress(me.walletAddress)}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">Connected</span>
                </div>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">X account</p>
                {me.xUsername ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#F8FAFC]">@{me.xUsername}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">Verified</span>
                    <span className="text-[12px] text-[#64748B]">
                      since {new Date(me.xConnectedAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-[#64748B]">Not connected</span>
                    <a href="/api/auth/x/connect">
                      <Button size="sm" variant="outline">Connect X</Button>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-6 sm:text-right">
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Markets today</p>
                <p className="text-[28px] font-semibold text-[#F8FAFC] tabular-nums leading-none">
                  {me.marketsCreatedToday}
                  <span className="text-[16px] font-normal text-[#64748B]">/10</span>
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Total created</p>
                <p className="text-[28px] font-semibold text-[#F8FAFC] tabular-nums leading-none">
                  {me.totalMarketsCreated}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tweets section */}
        {me.xUserId && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-semibold text-[#F8FAFC]">Recent tweets</h2>
                <p className="text-[13px] text-[#64748B] mt-1">
                  Only tweets posted after X connection are shown. Eligible tweets (3h or less) can become markets.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
            </div>

            {tweetsData?.error && (
              <div className="p-4 rounded-[16px] bg-[#EF4444]/[0.08] border border-[#EF4444]/20 text-[#EF4444] text-[14px]">
                {tweetsData.error}
              </div>
            )}

            {tweetsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-[24px] shimmer" />
                ))}
              </div>
            ) : tweets.length === 0 ? (
              <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] py-14 text-center">
                <p className="text-[15px] text-[#64748B] mb-2">You have no eligible tweets yet.</p>
                <p className="text-[13px] text-[#64748B]">
                  Post on X after connecting your account, then return here to create a market.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tweets.map((t: any) => <TweetCard key={t.id} tweet={t} />)}
              </div>
            )}
          </div>
        )}

        {!me.xUserId && me.walletAddress && (
          <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] py-14 text-center">
            <p className="text-[15px] text-[#64748B] mb-4">
              Connect X to create markets from your fresh tweets.
            </p>
            <a href="/api/auth/x/connect">
              <Button variant="xen">Connect X Account</Button>
            </a>
          </div>
        )}
      </div>
    </AppShell>
  )
}
