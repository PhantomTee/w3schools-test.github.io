'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCount, timeUntil, metricLabel } from '@/lib/utils'
import type { Range } from '@/types/market'

interface Pool { rangeIndex: number; amount: string }
interface Props {
  market: {
    id:                string
    tweetId:           string
    xUsername:         string | null
    metricType:        string
    state:             string
    expiresAt:         string
    totalStaked:       string
    startValue:        string
    winningRangeIndex: number | null
    ranges:            Range[]
    pools:             Pool[]
    durationHours:     number
  }
}

function stateVariant(state: string): 'green' | 'blue' | 'red' | 'amber' | 'default' {
  if (state === 'OPEN')     return 'green'
  if (state === 'RESOLVED') return 'blue'
  if (state === 'VOIDED')   return 'red'
  if (state === 'LOCKED')   return 'amber'
  return 'default'
}

export function MarketCard({ market }: Props) {
  const totalPool    = BigInt(market.totalStaked)
  const totalDisplay = (parseFloat(market.totalStaked) / 1e6).toFixed(2)

  return (
    <Link href={`/market/${market.id}`} className="block group">
      <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-5 transition-all duration-200 hover:border-white/[0.10] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[13px] text-[#64748B] font-medium truncate">
              {market.xUsername ? `@${market.xUsername}` : 'Unknown creator'}
            </p>
            <p className="text-[15px] font-semibold text-[#F8FAFC] mt-0.5">
              Final {metricLabel(market.metricType as any)} · {market.durationHours}h
            </p>
          </div>
          <Badge variant={stateVariant(market.state)}>
            {market.state}
          </Badge>
        </div>

        <p className="text-[13px] text-[var(--text-muted)] mb-4">
          What will the final total {metricLabel(market.metricType as any).toLowerCase()} be?
        </p>

        <div className="space-y-2 mb-4">
          {market.ranges.slice(0, 5).map((r, i) => {
            const pool  = BigInt(market.pools.find(p => p.rangeIndex === i)?.amount ?? '0')
            const pct   = totalPool > 0n ? Number((pool * 100n) / totalPool) : 0
            const isWin = market.state === 'RESOLVED' && market.winningRangeIndex === i
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWin ? 'bg-[var(--ink)]' : 'bg-[var(--text-muted)]'}`}
                    style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <span className={`text-[12px] font-medium w-[72px] text-right tabular-nums ${isWin ? 'text-[var(--ink)]' : 'text-[var(--text-muted)]'}`}>
                  {r.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] text-[13px]">
          <span className="text-[#64748B]">{totalDisplay} USDC pool</span>
          {market.state === 'OPEN' && (
            <span className="text-[#F59E0B] font-medium">Ends in {timeUntil(market.expiresAt)}</span>
          )}
          {market.state === 'RESOLVED' && (
            <span className="text-[var(--ink)]">Settled</span>
          )}
          {market.state === 'LOCKED' && (
            <span className="text-[#F59E0B]">Locked</span>
          )}
        </div>
      </div>
    </Link>
  )
}
