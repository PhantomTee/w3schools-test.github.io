'use client'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { MarketListCard } from '@/components/markets/MarketListCard'
import type { MarketWithPools } from '@/types/market'

export default function ActivityPage() {
  const { data, isLoading } = useQuery<{ markets: MarketWithPools[] }>({
    queryKey: ['activity'],
    queryFn:  () => fetch('/api/markets?filter=all&page=1').then(r => r.json()),
    staleTime: 30_000,
  })

  const markets = data?.markets ?? []

  return (
    <AppShell>
      <div className="max-w-[640px] mx-auto px-4 pt-6 pb-10">
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] mb-1">Activity</h1>
        <p className="text-[14px] text-[var(--text-muted)] mb-6">Recent market activity across Xen.</p>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[120px] rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-soft)] animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && markets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[15px] text-[var(--text-muted)]">No markets yet.</p>
          </div>
        )}

        {!isLoading && markets.length > 0 && (
          <div className="space-y-3">
            {markets.map(m => (
              <MarketListCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
