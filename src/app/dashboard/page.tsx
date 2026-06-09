'use client'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { MarketCard } from '@/components/markets/MarketCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: meData } = useQuery({
    queryKey:  ['me'],
    queryFn:   () => fetch('/api/auth/me').then(r => r.json()),
    staleTime: 60_000,
  })
  const me = meData?.user

  const { data: liveData,     isLoading: liveLoading }  = useQuery({
    queryKey:        ['markets', 'live'],
    queryFn:         () => fetch('/api/markets?filter=live').then(r => r.json()),
    refetchInterval: 30_000,
  })
  const { data: endingData }  = useQuery({
    queryKey:        ['markets', 'ending'],
    queryFn:         () => fetch('/api/markets?filter=ending').then(r => r.json()),
    refetchInterval: 60_000,
  })
  const { data: resolvedData } = useQuery({
    queryKey:  ['markets', 'resolved'],
    queryFn:   () => fetch('/api/markets?filter=resolved').then(r => r.json()),
    staleTime: 120_000,
  })

  const liveMarkets     = liveData?.markets     ?? []
  const endingMarkets   = endingData?.markets   ?? []
  const resolvedMarkets = resolvedData?.markets ?? []
  const totalPool = liveMarkets.reduce((s: number, m: any) => s + parseFloat(m.totalStaked) / 1e6, 0)

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Dashboard</h1>
            <p className="text-[14px] text-[#64748B]">USDC range prediction markets on tweet attention</p>
          </div>
          {me && (
            <Link href="/profile">
              <Button variant="outline" size="sm">Create Market</Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Live markets',    value: String(liveMarkets.length),               color: '#22C55E' },
            { label: 'Total USDC pool', value: `${totalPool.toFixed(0)} USDC`,           color: '#3B82F6' },
            { label: 'Ending soon',     value: String(endingMarkets.length),              color: '#F59E0B' },
            { label: 'Resolved',        value: String(resolvedMarkets.length),            color: '#64748B' },
          ].map((s, i) => (
            <div key={i} className="rounded-[20px] bg-[#0B1220] border border-white/[0.06] p-5">
              <p className="text-[12px] text-[#64748B] mb-2">{s.label}</p>
              <p className="text-[22px] font-semibold tracking-tight tabular-nums" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Wallet status */}
        {me && (
          <div className="rounded-[20px] bg-[#0B1220] border border-white/[0.06] p-5 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  <span className="text-[13px] font-mono text-[#94A3B8]">
                    {me.walletAddress?.slice(0, 6)}...{me.walletAddress?.slice(-4)}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">Connected</span>
                </div>
                {me.xUsername ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#94A3B8]">@{me.xUsername}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">X verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#64748B]">X not connected</span>
                    <a href="/api/auth/x/connect" className="text-[13px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                      Connect X
                    </a>
                  </div>
                )}
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-[11px] text-[#64748B]">Markets today</p>
                  <p className="text-[18px] font-semibold text-[#F8FAFC] tabular-nums">
                    {me.marketsCreatedToday}<span className="text-[13px] text-[#64748B] font-normal">/10</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#64748B]">Total created</p>
                  <p className="text-[18px] font-semibold text-[#F8FAFC] tabular-nums">{me.totalMarketsCreated}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live markets */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-semibold text-[#F8FAFC]">Live markets</h2>
            <Link href="/markets" className="text-[13px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
              View all
            </Link>
          </div>

          {liveLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-[24px] shimmer" />
              ))}
            </div>
          ) : liveMarkets.length === 0 ? (
            <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] py-14 text-center">
              <p className="text-[15px] text-[#64748B] mb-1">No live markets found.</p>
              <p className="text-[13px] text-[#64748B]">Create a market from a fresh tweet or check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMarkets.slice(0, 6).map((m: any) => <MarketCard key={m.id} market={m} />)}
            </div>
          )}
        </div>

        {/* Ending soon */}
        {endingMarkets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-semibold text-[#F8FAFC]">Ending soon</h2>
              <span className="text-[12px] text-[#F59E0B]">
                {endingMarkets.length} market{endingMarkets.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {endingMarkets.slice(0, 3).map((m: any) => <MarketCard key={m.id} market={m} />)}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
