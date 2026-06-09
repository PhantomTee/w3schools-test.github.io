'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { MarketCard } from '@/components/markets/MarketCard'

type Tab    = 'live' | 'ending' | 'resolved' | 'all'
type Metric = '' | 'FINAL_VIEWS' | 'FINAL_LIKES' | 'FINAL_REPOSTS' | 'FINAL_REPLIES'

const TABS: { value: Tab; label: string }[] = [
  { value: 'live',     label: 'Live'         },
  { value: 'ending',   label: 'Ending soon'  },
  { value: 'resolved', label: 'Resolved'     },
  { value: 'all',      label: 'All'          },
]

const METRICS: { value: Metric; label: string }[] = [
  { value: '',               label: 'All metrics' },
  { value: 'FINAL_VIEWS',    label: 'Final views'   },
  { value: 'FINAL_LIKES',    label: 'Final likes'   },
  { value: 'FINAL_REPOSTS',  label: 'Final reposts' },
  { value: 'FINAL_REPLIES',  label: 'Final replies' },
]

export default function MarketsPage() {
  const [tab,    setTab]    = useState<Tab>('live')
  const [metric, setMetric] = useState<Metric>('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey:        ['markets', tab, metric],
    queryFn:         () => fetch(`/api/markets?filter=${tab}${metric ? `&metric=${metric}` : ''}`).then(r => r.json()),
    refetchInterval: 30_000,
  })

  const markets: any[] = (data?.markets ?? []).filter((m: any) =>
    !search ||
    m.tweetId.includes(search) ||
    (m.xUsername ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Markets</h1>
          <p className="text-[14px] text-[#64748B]">USDC range prediction markets on tweet attention</p>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Tab pills */}
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  tab === t.value
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#101827] text-[#64748B] hover:text-[#94A3B8] hover:bg-[#151E2E]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Metric pills */}
          <div className="flex gap-1.5 flex-wrap">
            {METRICS.map(m => (
              <button
                key={m.value}
                onClick={() => setMetric(m.value)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  metric === m.value
                    ? 'bg-[#151E2E] text-[#BFDBFE] border border-[rgba(59,130,246,0.30)]'
                    : 'bg-[#101827] text-[#64748B] hover:text-[#94A3B8] hover:bg-[#151E2E]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="sm:ml-auto">
            <input
              type="text"
              placeholder="Search by creator..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-48 h-8 px-3 rounded-[10px] bg-[#101827] border border-white/[0.08] text-[13px] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/40"
            />
          </div>
        </div>

        {/* Market grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-[24px] shimmer" />
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] py-16 text-center">
            <p className="text-[15px] text-[#64748B] mb-2">No {tab === 'all' ? '' : tab} markets found.</p>
            <p className="text-[13px] text-[#64748B]">
              {tab === 'live'
                ? 'Create a market from a fresh tweet or adjust your filters.'
                : 'Try a different filter or check back later.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((m: any) => <MarketCard key={m.id} market={m} />)}
          </div>
        )}
      </div>
    </AppShell>
  )
}
