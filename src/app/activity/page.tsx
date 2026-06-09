'use client'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { metricLabel, formatCount } from '@/lib/utils'
import Link from 'next/link'

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

export default function ActivityPage() {
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
  })
  const me = meData?.user

  const { data: allData, isLoading } = useQuery({
    queryKey:  ['markets', 'all-activity'],
    queryFn:   () => fetch('/api/markets?filter=all').then(r => r.json()),
    enabled:   !!me,
    staleTime: 60_000,
  })

  if (!me) {
    return (
      <AppShell>
        <div className="px-5 sm:px-8 py-16 max-w-2xl mx-auto text-center space-y-4">
          <p className="text-[20px] font-semibold text-[#F8FAFC]">Connect your wallet</p>
          <p className="text-[15px] text-[#64748B]">Sign in to view your activity.</p>
        </div>
      </AppShell>
    )
  }

  const markets  = (allData?.markets ?? []) as any[]
  const myMarkets = markets.filter((m: any) =>
    m.creatorWallet?.toLowerCase() === me.walletAddress?.toLowerCase()
  )
  const myBets = markets.filter((m: any) =>
    m.userStakes?.length > 0
  )

  const events: Array<{
    type:      string
    label:     string
    sub:       string
    date:      string
    marketId?: string
    color:     string
  }> = []

  myMarkets.forEach((m: any) => {
    events.push({
      type:     'created',
      label:    'Market created',
      sub:      `Final ${metricLabel(m.metricType)} · ${m.durationHours}h · 0.5 USDC creation fee`,
      date:     m.createdAt,
      marketId: m.id,
      color:    '#3B82F6',
    })
    if (m.state === 'RESOLVED') {
      events.push({
        type:     'resolved',
        label:    'Market resolved',
        sub:      `Winning range: ${m.ranges?.[m.winningRangeIndex]?.label ?? '—'} · Final value: ${m.finalValue ? formatCount(Number(m.finalValue)) : '—'}`,
        date:     m.expiresAt,
        marketId: m.id,
        color:    '#22C55E',
      })
    }
    if (m.state === 'VOIDED') {
      events.push({
        type:     'voided',
        label:    'Market voided',
        sub:      'Final metric could not be verified',
        date:     m.expiresAt,
        marketId: m.id,
        color:    '#EF4444',
      })
    }
  })

  myBets.forEach((m: any) => {
    m.userStakes?.forEach((s: any) => {
      const range = m.ranges?.[s.rangeIndex]
      events.push({
        type:     'prediction',
        label:    'Prediction placed',
        sub:      `Range: ${range?.label ?? '—'} · Stake: ${(Number(s.amount) / 1e6).toFixed(2)} USDC`,
        date:     m.createdAt,
        marketId: m.id,
        color:    '#F59E0B',
      })
    })
  })

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Activity</h1>
          <p className="text-[14px] text-[#64748B]">Your market history and predictions</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-[20px] shimmer" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] py-16 text-center">
            <p className="text-[15px] text-[#64748B] mb-2">No activity yet.</p>
            <p className="text-[13px] text-[#64748B]">
              Create a market or place a prediction to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div key={i} className={ev.marketId ? 'block' : undefined}>
                {ev.marketId ? (
                  <Link href={`/market/${ev.marketId}`}>
                    <div className="flex items-start gap-4 p-4 rounded-[16px] bg-[#080D14] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                      <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#F8FAFC]">{ev.label}</p>
                        <p className="text-[12px] text-[#64748B] mt-0.5 truncate">{ev.sub}</p>
                      </div>
                      <span className="text-[12px] text-[#64748B] shrink-0">{timeAgo(ev.date)}</span>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start gap-4 p-4 rounded-[16px] bg-[#080D14] border border-white/[0.04]">
                    <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ev.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#F8FAFC]">{ev.label}</p>
                      <p className="text-[12px] text-[#64748B] mt-0.5 truncate">{ev.sub}</p>
                    </div>
                    <span className="text-[12px] text-[#64748B] shrink-0">{timeAgo(ev.date)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
