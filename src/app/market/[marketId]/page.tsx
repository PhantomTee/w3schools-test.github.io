'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MarketChart from '@/components/market/MarketChart'
import PredictionPanel from '@/components/market/PredictionPanel'
import EvidencePanel from '@/components/market/EvidencePanel'
import GenLayerPanel from '@/components/market/GenLayerPanel'
import ActivityFeed from '@/components/market/ActivityFeed'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function StateBadge({ state }: { state: string }) {
  const variantMap: Record<string, string> = {
    OPEN: 'open',
    LOCKED: 'ending',
    RESOLVED: 'resolved',
    VOIDED: 'voided',
    CANCELLED: 'neutral',
  }
  const labelMap: Record<string, string> = {
    OPEN: 'Open',
    LOCKED: 'Locked',
    RESOLVED: 'Resolved',
    VOIDED: 'Voided',
    CANCELLED: 'Cancelled',
  }
  return (
    <Badge variant={variantMap[state] as any ?? 'neutral'}>
      {labelMap[state] ?? state}
    </Badge>
  )
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function metricLabel(metricType: string): string {
  const map: Record<string, string> = {
    FINAL_VIEWS: 'views',
    FINAL_LIKES: 'likes',
    FINAL_RETWEETS: 'retweets',
    FINAL_REPLIES: 'replies',
    FINAL_BOOKMARKS: 'bookmarks',
  }
  return map[metricType] ?? metricType.toLowerCase().replace('final_', '')
}

function formatUSDC(raw: string): string {
  const n = Number(raw) / 1_000_000
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

/* ─── range rows ──────────────────────────────────────────────────────────── */

interface RangeRow {
  min: number
  max: number
  maxOpen: boolean
  label: string
  difficulty?: number
}

function RangeRows({
  ranges,
  pools,
  totalStaked,
  winningRangeIndex,
  state,
}: {
  ranges: RangeRow[]
  pools: { rangeIndex: number; amount: string }[]
  totalStaked: string
  winningRangeIndex: number | null
  state: string
}) {
  const total = Number(totalStaked) || 0

  return (
    <div className="flex flex-col gap-2">
      {ranges.map((r, i) => {
        const poolAmt = Number(pools.find(p => p.rangeIndex === i)?.amount ?? '0')
        const pct = total > 0 ? (poolAmt / total) * 100 : 0
        const poolUSDC = formatUSDC(String(poolAmt))
        const payout = poolAmt > 0 && total > 0 ? (total / poolAmt).toFixed(2) : '—'
        const isWinner = state === 'RESOLVED' && winningRangeIndex === i
        const isResolved = state === 'RESOLVED'

        return (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all',
              isWinner
                ? 'border-[var(--xen-green)]/40 bg-[var(--xen-green)]/5 text-[var(--xen-green)]'
                : isResolved
                ? 'border-[var(--border-soft)] opacity-50'
                : 'border-[var(--border-soft)]'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{r.label}</span>
              {isWinner && (
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  Winner
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs font-medium">{poolUSDC}</div>
              <div className="text-[10px] opacity-60">{pct.toFixed(0)}% · {payout}x</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── tweet preview card (desktop col 1) ─────────────────────────────────── */

function TweetCard({ market }: { market: any }) {
  return (
    <div
      style={{ background: 'var(--bg-elevated)', borderRadius: 20 }}
      className="p-5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
          {market.xUsername}
        </span>
        {market.tweetId && (
          <a
            href={`https://twitter.com/i/web/status/${market.tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--blue-primary)', fontSize: 12 }}
            className="ml-auto hover:underline"
          >
            View tweet ↗
          </a>
        )}
      </div>
      {market.tweetText && (
        <p
          style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}
          className="italic"
        >
          {market.tweetText}
        </p>
      )}
      <div className="flex items-center gap-4 pt-1">
        <div>
          <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            {formatMetric(Number(market.startValue))}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>start {metricLabel(market.metricType)}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            {market.durationHours}h
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>duration</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            {formatUSDC(market.totalStaked)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>pool</div>
        </div>
      </div>
    </div>
  )
}

/* ─── stats bar ──────────────────────────────────────────────────────────── */

function StatsBar({ market }: { market: any }) {
  const isOpen = market.state === 'OPEN'
  return (
    <div
      style={{ background: 'var(--bg-elevated)', borderRadius: 12 }}
      className="flex items-center divide-x divide-[var(--border-soft)] overflow-hidden"
    >
      <div className="flex-1 flex flex-col items-center py-2.5 px-3">
        <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
          {formatMetric(Number(market.startValue))}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>current</span>
      </div>
      <div className="flex-1 flex flex-col items-center py-2.5 px-3">
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: isOpen ? 'var(--xen-amber)' : 'var(--text-muted)',
          }}
        >
          {isOpen ? timeLeft(market.expiresAt) : market.state}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>time left</span>
      </div>
      <div className="flex-1 flex flex-col items-center py-2.5 px-3">
        <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
          {formatUSDC(market.totalStaked)}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>pool</span>
      </div>
    </div>
  )
}

/* ─── page ────────────────────────────────────────────────────────────────── */

export default function MarketPage() {
  const { marketId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => fetch(`/api/markets/${marketId}`).then(r => r.json()),
    refetchInterval: 15_000,
  })

  const market = data?.market

  /* loading */
  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-[520px] mx-auto px-4 pt-6 pb-8 flex flex-col gap-4">
          <div className="animate-pulse h-6 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
          <div className="animate-pulse h-24 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          <div className="animate-pulse h-40 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </AppShell>
    )
  }

  /* error */
  if (error || !market) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Market not found</p>
          <Link href="/markets">
            <Button variant="ghost" size="sm" style={{ color: 'var(--blue-primary)' }}>
              ← Back to Markets
            </Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const isOpen = market.state === 'OPEN'

  /* ── market question ── */
  const question = `What will this tweet's ${metricLabel(market.metricType)} be in ${market.durationHours}h?`

  return (
    <AppShell>
      {/* ════════════════════════════════════════════════════════════
          MOBILE  (single column, hidden on md+)
      ════════════════════════════════════════════════════════════ */}
      <div className="md:hidden max-w-[520px] mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
        {/* back link */}
        <Link
          href="/markets"
          style={{ color: 'var(--text-muted)', fontSize: 12 }}
          className="hover:opacity-80 w-fit"
        >
          ← Markets
        </Link>

        {/* status row */}
        <div className="flex items-center gap-2">
          <StateBadge state={market.state} />
          <span
            style={{
              fontSize: 12,
              color: isOpen ? 'var(--xen-amber)' : 'var(--text-muted)',
            }}
          >
            {isOpen ? `${timeLeft(market.expiresAt)} left` : market.state.toLowerCase()}
          </span>
        </div>

        {/* creator */}
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{market.xUsername}</span>

        {/* tweet preview */}
        {market.tweetText && (
          <p
            style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}
            className="italic line-clamp-3 -mt-2 mb-1"
          >
            {market.tweetText}
          </p>
        )}

        {/* market question */}
        <h1
          style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}
          className="mb-1"
        >
          {question}
        </h1>

        {/* stats bar */}
        <StatsBar market={market} />

        {/* chart */}
        <MarketChart market={market} />

        {/* range rows */}
        <RangeRows
          ranges={market.ranges}
          pools={market.pools}
          totalStaked={market.totalStaked}
          winningRangeIndex={market.winningRangeIndex}
          state={market.state}
        />

        {/* prediction panel */}
        {isOpen && <PredictionPanel market={market} />}

        {/* evidence */}
        <EvidencePanel market={market} />

        {/* genlayer */}
        <GenLayerPanel report={market.genLayerReport} />

        {/* activity */}
        <ActivityFeed bets={market.recentBets} ranges={market.ranges} />
      </div>

      {/* ════════════════════════════════════════════════════════════
          DESKTOP  (3-column grid, hidden below md)
      ════════════════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[1fr_1fr_360px] md:gap-6 md:max-w-[1200px] md:mx-auto md:px-6 md:pt-6 md:pb-10">
        {/* ── col 1: tweet card + evidence + genlayer + activity ── */}
        <div className="flex flex-col gap-5">
          <TweetCard market={market} />
          <EvidencePanel market={market} />
          <GenLayerPanel report={market.genLayerReport} />
          <ActivityFeed bets={market.recentBets} ranges={market.ranges} />
        </div>

        {/* ── col 2: question + stats + chart + ranges ── */}
        <div className="flex flex-col gap-5">
          {/* back + status */}
          <div className="flex items-center gap-3">
            <Link
              href="/markets"
              style={{ color: 'var(--text-muted)', fontSize: 12 }}
              className="hover:opacity-80"
            >
              ← Markets
            </Link>
            <StateBadge state={market.state} />
            <span
              style={{
                fontSize: 12,
                color: isOpen ? 'var(--xen-amber)' : 'var(--text-muted)',
              }}
            >
              {isOpen ? `${timeLeft(market.expiresAt)} left` : ''}
            </span>
          </div>

          {/* question */}
          <h1
            style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, lineHeight: 1.25 }}
          >
            {question}
          </h1>

          {/* stats bar */}
          <StatsBar market={market} />

          {/* chart */}
          <MarketChart market={market} />

          {/* range rows */}
          <RangeRows
            ranges={market.ranges}
            pools={market.pools}
            totalStaked={market.totalStaked}
            winningRangeIndex={market.winningRangeIndex}
            state={market.state}
          />
        </div>

        {/* ── col 3: sticky prediction panel ── */}
        <div className="sticky top-6 self-start">
          <PredictionPanel market={market} />
        </div>
      </div>
    </AppShell>
  )
}
