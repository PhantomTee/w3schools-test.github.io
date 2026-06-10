'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PredictionDrawer } from './PredictionDrawer'
import type { MarketWithPools } from '@/types/market'

interface MarketSwipeCardProps {
  market:    MarketWithPools
  style?:    React.CSSProperties
  className?: string
  isActive:  boolean
  isPeeking: boolean
}

function timeLeft(expiresAt: string | Date): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function metricLabel(type: string): string {
  switch (type) {
    case 'FINAL_VIEWS':   return 'Current views'
    case 'FINAL_LIKES':   return 'Current likes'
    case 'FINAL_REPOSTS': return 'Current reposts'
    case 'FINAL_REPLIES': return 'Current replies'
    default: return 'Current value'
  }
}

// Build a by-index pool lookup from pools array
function buildPoolMap(pools: { rangeIndex: number; amount: string }[]): Map<number, bigint> {
  const map = new Map<number, bigint>()
  for (const p of pools) map.set(p.rangeIndex, BigInt(p.amount))
  return map
}

export function MarketSwipeCard({
  market,
  style,
  className,
  isActive,
  isPeeking,
}: MarketSwipeCardProps) {
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [selectedRange, setSelectedRange] = useState<number | null>(null)

  const totalPool = BigInt(market.totalStaked ?? '0')
  const poolMap   = buildPoolMap(market.pools ?? [])
  const ranges    = market.ranges ?? []

  const tl   = timeLeft(market.expiresAt)
  const pool = Number(totalPool) / 1_000_000

  return (
    <>
      <div
        style={style}
        className={cn(
          'absolute inset-x-0 top-0 w-full transition-all duration-300',
          'rounded-[28px] overflow-hidden',
          'border border-[var(--border-soft)]',
          isActive && 'border-glow-green',
          isPeeking && 'pointer-events-none',
          className
        )}
      >
        {/* Tweet media or gradient header */}
        <div className="relative h-[220px] overflow-hidden bg-[var(--bg-navy)]">
          {market.tweetMediaUrl ? (
            <>
              <img
                src={market.tweetMediaUrl}
                alt="tweet media"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#242424] to-[#1A1A1A]">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #10B981 0%, transparent 60%)' }}
              />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-4 right-4">
            <Badge variant="open" className="text-[10px] px-2 py-0.5">Open</Badge>
          </div>

          {/* Creator + tweet text */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[11px] text-white/60 mb-1">@{market.xUsername ?? 'creator'}</p>
            {market.tweetText && (
              <p className="text-[13px] text-white/90 leading-relaxed line-clamp-2 font-medium">
                &ldquo;{market.tweetText}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="bg-[var(--bg-card)] px-5 pt-4 pb-5">
          <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-[var(--text-primary)] leading-snug mb-4 text-balance">
            What will this tweet&apos;s {market.metricType.replace('FINAL_', '').toLowerCase()} be in {market.durationHours}h?
          </h2>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4 text-[12px]">
            <div>
              <p className="text-[var(--text-muted)]">{metricLabel(market.metricType)}</p>
              <p className="text-[15px] font-semibold text-[var(--text-primary)] tabular-nums">
                {formatMetric(parseInt(market.startValue ?? '0'))}
              </p>
            </div>
            <div className="h-8 w-px bg-[var(--border-soft)]" />
            <div>
              <p className="text-[var(--text-muted)]">Time left</p>
              <p className="text-[15px] font-semibold text-[var(--xen-amber)] tabular-nums">{tl}</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-soft)]" />
            <div>
              <p className="text-[var(--text-muted)]">USDC pool</p>
              <p className="text-[15px] font-semibold text-[var(--text-primary)] tabular-nums">{pool.toFixed(0)} USDC</p>
            </div>
          </div>

          {/* Range rows */}
          <div className="space-y-2 mb-4">
            {ranges.slice(0, 5).map((range, i) => {
              const rangePool  = poolMap.get(i) ?? 0n
              const poolUsdc   = (Number(rangePool) / 1_000_000).toFixed(0)
              const totalNum   = Number(totalPool)
              const rangeNum   = Number(rangePool)
              const payout     = rangeNum > 0 ? `${(totalNum / rangeNum).toFixed(1)}x` : '—'
              const isSelected = selectedRange === i

              return (
                <button
                  key={i}
                  onClick={() => { setSelectedRange(i); setDrawerOpen(true) }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px]',
                    'border transition-all duration-150 text-left',
                    isSelected
                      ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/[0.08] shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] hover:border-[rgba(16,185,129,0.25)] hover:bg-[var(--bg-muted)]'
                  )}
                >
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{range.label}</span>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-[var(--text-muted)]">{poolUsdc} USDC</span>
                    <span className={cn(
                      'font-semibold tabular-nums min-w-[32px] text-right',
                      isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
                    )}>{payout}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Source badges */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="neutral" className="text-[10px]">X API</Badge>
            <Badge variant="neutral" className="text-[10px]">Arc USDC</Badge>
            <Badge variant="neutral" className="text-[10px]">GenLayer ranges</Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="xen"
              size="lg"
              className="flex-1"
              onClick={() => setDrawerOpen(true)}
            >
              Place Prediction
            </Button>
            <Link href={`/market/${market.id}`} className="shrink-0">
              <Button variant="outline" size="lg">View Details</Button>
            </Link>
          </div>
        </div>
      </div>

      <PredictionDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedRange(null) }}
        market={market}
        initialRangeIndex={selectedRange ?? 0}
      />
    </>
  )
}
