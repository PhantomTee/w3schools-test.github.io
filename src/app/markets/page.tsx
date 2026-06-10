'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { MarketListCard } from '@/components/markets/MarketListCard'
import type { MarketWithPools } from '@/types/market'

type Filter = 'all' | 'live' | 'ending' | 'resolved'
type Metric = '' | 'FINAL_VIEWS' | 'FINAL_LIKES' | 'FINAL_REPOSTS' | 'FINAL_REPLIES'

const FILTER_TABS: { label: string; value: Filter }[] = [
  { label: 'All',         value: 'all' },
  { label: 'Live',        value: 'live' },
  { label: 'Ending Soon', value: 'ending' },
  { label: 'Resolved',    value: 'resolved' },
]

const METRIC_PILLS: { label: string; value: Metric }[] = [
  { label: 'All',     value: '' },
  { label: 'Views',   value: 'FINAL_VIEWS' },
  { label: 'Likes',   value: 'FINAL_LIKES' },
  { label: 'Reposts', value: 'FINAL_REPOSTS' },
  { label: 'Replies', value: 'FINAL_REPLIES' },
]

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[20px] p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded-full" />
        <div className="h-5 w-14 bg-[var(--bg-elevated)] rounded-full" />
      </div>
      <div className="h-3 w-full bg-[var(--bg-elevated)] rounded-full mb-2" />
      <div className="h-3 w-3/4 bg-[var(--bg-elevated)] rounded-full mb-4" />
      <div className="h-4 w-2/3 bg-[var(--bg-elevated)] rounded-full mb-4" />
      <div className="flex gap-3">
        <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded-full" />
        <div className="h-3 w-12 bg-[var(--bg-elevated)] rounded-full" />
        <div className="h-3 w-14 bg-[var(--bg-elevated)] rounded-full" />
      </div>
    </div>
  )
}

export default function MarketsPage() {
  const [filter, setFilter]   = useState<Filter>('all')
  const [metric, setMetric]   = useState<Metric>('')
  const [search, setSearch]   = useState('')

  const { data: markets, isLoading } = useQuery<MarketWithPools[]>({
    queryKey: ['markets', filter, metric],
    queryFn: async () => {
      const params = new URLSearchParams({ filter })
      if (metric) params.set('metric', metric)
      const res = await fetch(`/api/markets?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch markets')
      return res.json()
    },
  })

  const filtered = (markets ?? []).filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.tweetText?.toLowerCase().includes(q) ||
      m.xUsername?.toLowerCase().includes(q)
    )
  })

  return (
    <AppShell>
      <div className="max-w-[900px] mx-auto px-4 pt-5 pb-8">

        {/* Filter tabs */}
        <div className="bg-[var(--bg-elevated)] rounded-[14px] p-1 flex gap-1 mb-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className="flex-1 py-1.5 rounded-[10px] text-[13px] font-medium transition-all"
              style={{
                background:
                  filter === tab.value
                    ? 'var(--ink)'
                    : 'transparent',
                color:
                  filter === tab.value
                    ? '#fff'
                    : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metric pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none">
          {METRIC_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setMetric(pill.value)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border"
              style={{
                background:
                  metric === pill.value
                    ? 'var(--ink)'
                    : 'transparent',
                color:
                  metric === pill.value
                    ? '#fff'
                    : 'var(--text-muted)',
                borderColor:
                  metric === pill.value
                    ? 'transparent'
                    : 'var(--border-soft)',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets..."
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-[12px] px-4 py-2.5 text-[13px] outline-none focus:border-[var(--border-active)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] mb-5"
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[var(--text-muted)] text-[14px]">
              {search ? 'No markets match your search.' : 'No markets found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((market) => (
              <MarketListCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
