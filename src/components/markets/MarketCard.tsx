'use client'
import Link from 'next/link'
import { Clock, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatUSDC, formatCount, timeUntil, metricLabel, stateColor } from '@/lib/utils'
import type { Range } from '@/types/market'

interface Pool { rangeIndex: number; amount: string }
interface Props {
  market: {
    id:             string
    tweetId:        string
    xUsername:      string | null
    metricType:     string
    state:          string
    expiresAt:      string
    totalStaked:    string
    startValue:     string
    winningRangeIndex: number | null
    ranges:         Range[]
    pools:          Pool[]
    durationHours:  number
  }
}

export function MarketCard({ market }: Props) {
  const totalPool = BigInt(market.totalStaked)
  const totalDisplay = parseFloat(market.totalStaked) / 1e6

  return (
    <Link href={`/market/${market.id}`}>
      <Card className="hover:gradient-border hover:glow-purple transition-all cursor-pointer group">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {market.xUsername ? `@${market.xUsername}` : 'Unknown'} · tweet {market.tweetId.slice(-6)}
              </p>
              <p className="text-sm font-medium mt-0.5">
                {metricLabel(market.metricType as any)} · {market.durationHours}h market
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={market.state === 'OPEN' ? 'green' : market.state === 'RESOLVED' ? 'blue' : 'amber'}
                className="text-xs"
              >
                {market.state}
              </Badge>
            </div>
          </div>

          {/* Question */}
          <p className="text-xs text-muted-foreground">
            What will the final total {metricLabel(market.metricType as any).toLowerCase()} be?
          </p>

          {/* Ranges with pools */}
          <div className="space-y-1.5">
            {market.ranges.slice(0, 4).map((r, i) => {
              const pool      = BigInt(market.pools.find(p => p.rangeIndex === i)?.amount ?? '0')
              const pct       = totalPool > 0n ? Number((pool * 100n) / totalPool) : 0
              const isWinning = market.state === 'RESOLVED' && market.winningRangeIndex === i
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isWinning ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}>
                      {r.label}
                    </span>
                    <span className={isWinning ? 'text-emerald-400' : 'text-muted-foreground'}>
                      {pct}%
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-1 ${isWinning ? '[&>div]:bg-emerald-500' : ''}`}
                  />
                </div>
              )
            })}
            {market.ranges.length > 4 && (
              <p className="text-xs text-muted-foreground text-center">
                +{market.ranges.length - 4} more ranges
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {totalDisplay.toFixed(2)} USDC pool
            </span>
            {market.state === 'OPEN' && (
              <span className={`flex items-center gap-1 ${stateColor(market.state)}`}>
                <Clock className="h-3.5 w-3.5" />
                {timeUntil(market.expiresAt)}
              </span>
            )}
            {market.state === 'RESOLVED' && (
              <span className="text-blue-400">Settled</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
