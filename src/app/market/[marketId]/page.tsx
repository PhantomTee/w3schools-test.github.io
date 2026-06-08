'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BetForm } from '@/components/markets/BetForm'
import { ClaimRefundButton } from '@/components/markets/ClaimRefundButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Eye, Heart, Repeat2, MessageCircle, Clock, TrendingUp,
  ExternalLink, AlertCircle, Loader2
} from 'lucide-react'
import {
  formatUSDC, formatCount, timeUntil, metricLabel, stateColor
} from '@/lib/utils'
import Link from 'next/link'
import type { Range } from '@/types/market'

function StateBadge({ state }: { state: string }) {
  const map: Record<string, any> = {
    OPEN:      'green',
    LOCKED:    'amber',
    RESOLVED:  'blue',
    VOIDED:    'red',
    CANCELLED: 'secondary',
  }
  return <Badge variant={map[state] ?? 'outline'}>{state}</Badge>
}

export default function MarketPage() {
  const { marketId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey:  ['market', marketId],
    queryFn:   () => fetch(`/api/markets/${marketId}`).then(r => r.json()),
    refetchInterval: 15_000,
  })

  const { data: meData } = useQuery({ queryKey: ['me'], queryFn: () => fetch('/api/auth/me').then(r => r.json()) })
  const me = meData?.user

  const market = data?.market

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !market) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto max-w-2xl px-4 py-16 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Market not found.</p>
          <Link href="/dashboard" className="text-primary text-sm hover:underline">Back to markets</Link>
        </main>
        <Footer />
      </div>
    )
  }

  const ranges: Range[] = market.ranges as Range[]
  const totalPool = BigInt(market.totalStaked)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: market info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {market.xUsername ? `@${market.xUsername}` : 'Unknown creator'} ·
                <a
                  href={`https://twitter.com/i/web/status/${market.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  View tweet <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <h1 className="text-xl font-bold">
                What will the final total {metricLabel(market.metricType).toLowerCase()} be?
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <StateBadge state={market.state} />
                <Badge variant="outline" className="text-xs">{market.durationHours}h market</Badge>
                <Badge variant="outline" className="text-xs">{metricLabel(market.metricType)}</Badge>
                {market.state === 'OPEN' && (
                  <span className={`flex items-center gap-1 text-sm ${stateColor(market.state)}`}>
                    <Clock className="h-4 w-4" /> {timeUntil(market.expiresAt)} remaining
                  </span>
                )}
              </div>
            </div>

            {/* Market details */}
            <Card>
              <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{formatCount(Number(market.startValue))}</div>
                  <div className="text-xs text-muted-foreground">Start value</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {(Number(market.totalStaked) / 1e6).toFixed(2)} USDC
                  </div>
                  <div className="text-xs text-muted-foreground">Total pool</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{ranges.length}</div>
                  <div className="text-xs text-muted-foreground">Ranges</div>
                </div>
              </CardContent>
            </Card>

            {/* Ranges pool distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Pool distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ranges.map((r, i) => {
                  const pool    = BigInt(market.pools?.find((p: any) => p.rangeIndex === i)?.amount ?? '0')
                  const pct     = totalPool > 0n ? Number((pool * 100n) / totalPool) : 0
                  const display = (Number(pool) / 1e6).toFixed(2)
                  const isWin   = market.state === 'RESOLVED' && market.winningRangeIndex === i

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={isWin ? 'text-emerald-400 font-semibold' : 'font-medium'}>
                            {r.label}
                          </span>
                          {isWin && <Badge variant="green" className="text-xs">Winner</Badge>}
                        </div>
                        <div className="text-right text-muted-foreground text-xs">
                          {display} USDC · {pct}%
                        </div>
                      </div>
                      <Progress
                        value={pct}
                        className={`h-2 ${isWin ? '[&>div]:bg-emerald-500' : ''}`}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Resolution info */}
            {market.state === 'RESOLVED' && market.finalValue && (
              <Card className="gradient-border glow-green">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">Resolved</Badge>
                    <span className="text-sm">
                      Final value: <strong>{formatCount(Number(market.finalValue))}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Winning range: <strong>{ranges[market.winningRangeIndex!]?.label ?? '—'}</strong>
                  </p>
                </CardContent>
              </Card>
            )}

            {market.state === 'VOIDED' && (
              <Card className="border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Market voided</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The final metric could not be verified. All bettors are entitled to a full refund.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: bet / claim panel */}
          <div className="space-y-4">
            {/* Claim / refund */}
            {me && (market.state === 'RESOLVED' || market.state === 'VOIDED' || market.state === 'CANCELLED') &&
             market.contractAddress && market.userStakes?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <ClaimRefundButton
                    contractAddress={market.contractAddress}
                    state={market.state}
                    winningRangeIndex={market.winningRangeIndex ?? null}
                    userStakes={market.userStakes ?? []}
                  />
                </CardContent>
              </Card>
            )}

            {/* Bet form */}
            {market.contractAddress && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Place a bet</CardTitle>
                </CardHeader>
                <CardContent>
                  <BetForm
                    marketId={market.id}
                    contractAddress={market.contractAddress}
                    creator={market.creatorWallet}
                    ranges={ranges}
                    pools={market.pools ?? []}
                    totalStaked={market.totalStaked}
                    state={market.state}
                    expiresAt={market.expiresAt}
                  />
                </CardContent>
              </Card>
            )}

            {!market.contractAddress && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Market not yet deployed on-chain. The creator's transaction may be pending.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
                <p>Payout = your share of the losing pool minus 1% protocol fee.</p>
                <p>If nobody picks the winning range, all bettors are refunded.</p>
                <p>Market settles via X API public metrics. GenLayer resolves disputes.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
