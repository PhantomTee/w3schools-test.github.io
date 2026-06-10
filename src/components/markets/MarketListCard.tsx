'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { MarketWithPools, MarketState } from '@/types/market'

interface Props {
  market: MarketWithPools
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const totalMinutes = Math.floor(diff / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatPool(totalStaked: string): string {
  try {
    const val = Number(BigInt(totalStaked)) / 1_000_000
    return val.toFixed(0) + ' USDC'
  } catch {
    return '0 USDC'
  }
}

function metricLabel(metricType: string): string {
  switch (metricType) {
    case 'FINAL_VIEWS':    return 'views'
    case 'FINAL_LIKES':    return 'likes'
    case 'FINAL_REPOSTS':  return 'reposts'
    case 'FINAL_REPLIES':  return 'replies'
    default:               return metricType.toLowerCase()
  }
}

type BadgeVariant = 'open' | 'ending' | 'resolved' | 'voided' | 'neutral'

function stateBadgeVariant(state: MarketState): BadgeVariant {
  switch (state) {
    case 'OPEN':      return 'open'
    case 'LOCKED':    return 'ending'
    case 'RESOLVED':  return 'resolved'
    case 'VOIDED':    return 'voided'
    case 'CANCELLED': return 'neutral'
    default:          return 'neutral'
  }
}

function stateBadgeLabel(state: MarketState): string {
  switch (state) {
    case 'OPEN':      return 'Open'
    case 'LOCKED':    return 'Ending'
    case 'RESOLVED':  return 'Resolved'
    case 'VOIDED':    return 'Voided'
    case 'CANCELLED': return 'Cancelled'
    default:          return state
  }
}

export function MarketListCard({ market }: Props) {
  const winningRange =
    market.winningRangeIndex != null
      ? market.ranges[market.winningRangeIndex]
      : null

  return (
    <Link
      href={`/market/${market.id}`}
      className="block bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[20px] p-4 hover:border-[rgba(59,130,246,0.25)] transition-all cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <span
          style={{ fontSize: 11 }}
          className="text-[var(--text-muted)] font-medium"
        >
          {market.xUsername ? `@${market.xUsername}` : '@unknown'}
        </span>
        <Badge variant={stateBadgeVariant(market.state)}>
          {stateBadgeLabel(market.state)}
        </Badge>
      </div>

      {/* Tweet text */}
      {market.tweetText && (
        <p
          style={{ fontSize: 12 }}
          className="text-[var(--text-secondary)] italic mb-2 line-clamp-2 leading-snug"
        >
          {market.tweetText}
        </p>
      )}

      {/* Market question */}
      <p
        style={{ fontSize: 14 }}
        className="text-[var(--text-primary)] font-medium mb-3 leading-snug"
      >
        What will this tweet&apos;s {metricLabel(market.metricType)} be in{' '}
        {market.durationHours}h?
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 11 }} className="text-[var(--text-muted)]">
          Pool: {formatPool(market.totalStaked)}
        </span>
        <span style={{ fontSize: 11 }} className="text-[var(--text-muted)]">
          {timeLeft(market.expiresAt)}
        </span>
        <span style={{ fontSize: 11 }} className="text-[var(--text-muted)]">
          {market.ranges.length} ranges
        </span>
      </div>

      {/* Winning range (resolved) */}
      {winningRange && (
        <p
          style={{ fontSize: 12 }}
          className="text-[var(--xen-green)] font-medium mt-2"
        >
          Winning: {winningRange.label}
        </p>
      )}
    </Link>
  )
}
