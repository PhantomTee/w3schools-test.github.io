'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { SwipeFeed } from '@/components/feed/SwipeFeed'
import { cn } from '@/lib/utils'
import type { MarketWithPools } from '@/types/market'

const FILTER_TABS = [
  { key: 'live',     label: 'Live'         },
  { key: 'ending',   label: 'Ending Soon'  },
  { key: 'all',      label: 'New'          },
  { key: 'resolved', label: 'Resolved'     },
] as const

type FilterKey = typeof FILTER_TABS[number]['key']

const METRIC_PILLS = [
  { key: '',               label: 'All'     },
  { key: 'FINAL_VIEWS',    label: 'Views'   },
  { key: 'FINAL_LIKES',    label: 'Likes'   },
  { key: 'FINAL_REPOSTS',  label: 'Reposts' },
  { key: 'FINAL_REPLIES',  label: 'Replies' },
]

const DURATION_PILLS = [
  { key: '',   label: 'Any' },
  { key: '1',  label: '1h'  },
  { key: '3',  label: '3h'  },
  { key: '6',  label: '6h'  },
  { key: '12', label: '12h' },
  { key: '24', label: '24h' },
  { key: '48', label: '48h' },
]

export default function FeedPage() {
  const [filter,   setFilter]   = useState<FilterKey>('live')
  const [metric,   setMetric]   = useState('')
  const [duration, setDuration] = useState('')

  const { data, isLoading, isError } = useQuery<{ markets: MarketWithPools[] }>({
    queryKey:  ['markets', filter, metric],
    queryFn:   async () => {
      const params = new URLSearchParams({ filter })
      if (metric) params.set('metric', metric)
      const res = await fetch(`/api/markets?${params}`)
      if (!res.ok) throw new Error('Failed to load markets')
      return res.json()
    },
    staleTime: 30_000,
  })

  const markets = (data?.markets ?? []).filter(m =>
    !duration || String(m.durationHours) === duration
  )

  return (
    <AppShell>
      <div className="max-w-[520px] mx-auto px-4 pt-4 pb-8">
        {/* Filter tabs */}
        <div className="flex gap-1 mb-3 bg-[var(--bg-elevated)] rounded-[14px] p-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex-1 py-1.5 rounded-[10px] text-[12px] font-medium transition-all duration-150',
                filter === tab.key
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metric pills */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-2 pb-1">
          {METRIC_PILLS.map(p => (
            <button
              key={p.key}
              onClick={() => setMetric(p.key)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-150',
                metric === p.key
                  ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/10 text-[var(--accent-bright)]'
                  : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[rgba(59,130,246,0.2)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Duration pills */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-5 pb-1">
          {DURATION_PILLS.map(p => (
            <button
              key={p.key}
              onClick={() => setDuration(p.key)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-150',
                duration === p.key
                  ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/10 text-[var(--accent-bright)]'
                  : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[rgba(59,130,246,0.2)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rounded-[28px] bg-[var(--bg-elevated)] border border-[var(--border-soft)] overflow-hidden animate-pulse"
              >
                <div className="h-[220px] bg-[var(--bg-muted)]" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-[var(--bg-muted)] rounded-full" />
                  <div className="h-4 w-1/2 bg-[var(--bg-muted)] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-[15px] text-[var(--text-muted)]">Could not load markets. Try again shortly.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <SwipeFeed markets={markets} />
        )}
      </div>
    </AppShell>
  )
}
