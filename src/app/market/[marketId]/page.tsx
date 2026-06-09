'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { BetForm } from '@/components/markets/BetForm'
import { ClaimRefundButton } from '@/components/markets/ClaimRefundButton'
import { Badge } from '@/components/ui/badge'
import { formatCount, timeUntil, metricLabel } from '@/lib/utils'
import Link from 'next/link'
import type { Range } from '@/types/market'

function stateVariant(state: string): 'green' | 'blue' | 'red' | 'amber' | 'default' {
  if (state === 'OPEN')     return 'green'
  if (state === 'RESOLVED') return 'blue'
  if (state === 'VOIDED')   return 'red'
  if (state === 'LOCKED')   return 'amber'
  return 'default'
}

export default function MarketPage() {
  const { marketId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey:        ['market', marketId],
    queryFn:         () => fetch(`/api/markets/${marketId}`).then(r => r.json()),
    refetchInterval: 15_000,
  })

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
  })
  const me     = meData?.user
  const market = data?.market

  if (isLoading) {
    return (
      <AppShell>
        <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto">
          <div className="h-96 rounded-[24px] shimmer" />
        </div>
      </AppShell>
    )
  }

  if (error || !market) {
    return (
      <AppShell>
        <div className="px-5 sm:px-8 py-16 max-w-2xl mx-auto text-center space-y-4">
          <p className="text-[20px] font-semibold text-[#F8FAFC]">Market not found</p>
          <Link href="/markets" className="text-[14px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
            Back to markets
          </Link>
        </div>
      </AppShell>
    )
  }

  const ranges: Range[] = market.ranges as Range[]
  const totalPool       = BigInt(market.totalStaked)

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto">
        {/* Back link */}
        <Link href="/markets" className="text-[13px] text-[#64748B] hover:text-[#94A3B8] transition-colors mb-6 block">
          Markets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: market info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] text-[#64748B] mb-2">
                    {market.xUsername ? `@${market.xUsername}` : 'Unknown creator'} ·{' '}
                    <a
                      href={`https://twitter.com/i/web/status/${market.tweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#94A3B8] transition-colors"
                    >
                      View tweet
                    </a>
                  </p>
                  <h1 className="text-[20px] font-semibold text-[#F8FAFC]">
                    What will the final total {metricLabel(market.metricType).toLowerCase()} be?
                  </h1>
                </div>
                <Badge variant={stateVariant(market.state)}>{market.state}</Badge>
              </div>

              <div className="flex flex-wrap gap-2 text-[13px]">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-[#94A3B8]">
                  {market.durationHours}h market
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-[#94A3B8]">
                  {metricLabel(market.metricType)}
                </span>
                {market.state === 'OPEN' && (
                  <span className="px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                    Ends in {timeUntil(market.expiresAt)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Start value</p>
                  <p className="text-[18px] font-semibold text-[#F8FAFC] tabular-nums">
                    {formatCount(Number(market.startValue))}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">USDC pool</p>
                  <p className="text-[18px] font-semibold text-[#F8FAFC] tabular-nums">
                    {(Number(market.totalStaked) / 1e6).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Ranges</p>
                  <p className="text-[18px] font-semibold text-[#F8FAFC]">{ranges.length}</p>
                </div>
              </div>
            </div>

            {/* Pool distribution */}
            <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6">
              <h2 className="text-[16px] font-semibold text-[#F8FAFC] mb-5">Pool distribution</h2>
              <div className="space-y-4">
                {ranges.map((r, i) => {
                  const pool    = BigInt(market.pools?.find((p: any) => p.rangeIndex === i)?.amount ?? '0')
                  const pct     = totalPool > 0n ? Number((pool * 100n) / totalPool) : 0
                  const display = (Number(pool) / 1e6).toFixed(2)
                  const isWin   = market.state === 'RESOLVED' && market.winningRangeIndex === i

                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[14px] font-medium ${isWin ? 'text-[#22C55E]' : 'text-[#F8FAFC]'}`}>
                            {r.label}
                          </span>
                          {isWin && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                              Winner
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] text-[#64748B] tabular-nums">
                          {display} USDC · {pct}%
                        </span>
                      </div>
                      <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWin ? 'bg-[#22C55E]' : 'bg-[#2563EB]/50'}`}
                          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resolution result */}
            {market.state === 'RESOLVED' && market.finalValue && (
              <div className="rounded-[24px] bg-[#0B1220] border border-[rgba(34,197,94,0.25)] p-6 glow-blue-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="green">Resolved</Badge>
                  <span className="text-[14px] text-[#94A3B8]">
                    Final value: <span className="text-[#F8FAFC] font-semibold">{formatCount(Number(market.finalValue))}</span>
                  </span>
                </div>
                <p className="text-[14px] text-[#64748B]">
                  Winning range: <span className="text-[#F8FAFC] font-medium">{ranges[market.winningRangeIndex!]?.label ?? '—'}</span>
                </p>
              </div>
            )}

            {market.state === 'VOIDED' && (
              <div className="rounded-[24px] bg-[#EF4444]/[0.06] border border-[#EF4444]/20 p-6">
                <p className="text-[14px] font-semibold text-[#EF4444] mb-1">Market voided</p>
                <p className="text-[13px] text-[#94A3B8]">
                  The final metric could not be verified. All stakes are eligible for a full refund.
                </p>
              </div>
            )}

            {/* Evidence */}
            <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] p-6">
              <h3 className="text-[14px] font-semibold text-[#94A3B8] mb-4 uppercase tracking-wide text-[12px]">Market evidence</h3>
              <div className="space-y-2 text-[13px]">
                {[
                  { label: 'Tweet ID',     value: market.tweetId },
                  { label: 'Created',      value: new Date(market.createdAt).toLocaleString() },
                  { label: 'Expires',      value: new Date(market.expiresAt).toLocaleString() },
                  { label: 'Start value',  value: formatCount(Number(market.startValue)) },
                  { label: 'Source',       value: 'X API' },
                  { label: 'Fallback',     value: 'GenLayer dispute resolution' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-[#64748B] shrink-0">{label}</span>
                    <span className="text-[#94A3B8] text-right font-mono text-[12px] break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market rules */}
            <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] p-6">
              <h3 className="text-[12px] font-semibold text-[#94A3B8] mb-4 uppercase tracking-wide">Market rules</h3>
              <ul className="space-y-2 text-[13px] text-[#64748B]">
                <li>Final total value at expiry decides the winner.</li>
                <li>Range minimum is inclusive. Range maximum is exclusive.</li>
                <li>The highest range is open-ended.</li>
                <li>X API is the primary resolution source.</li>
                <li>GenLayer handles fallback disputes.</li>
                <li>Creator cannot place predictions on their own market.</li>
              </ul>
            </div>
          </div>

          {/* Right: action panel */}
          <div className="space-y-4">
            {me && (market.state === 'RESOLVED' || market.state === 'VOIDED' || market.state === 'CANCELLED') &&
             market.contractAddress && market.userStakes?.length > 0 && (
              <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-5">
                <p className="text-[14px] font-semibold text-[#F8FAFC] mb-4">
                  {market.state === 'RESOLVED' ? 'Claim winnings' : 'Refund'}
                </p>
                <ClaimRefundButton
                  contractAddress={market.contractAddress}
                  state={market.state}
                  winningRangeIndex={market.winningRangeIndex ?? null}
                  userStakes={market.userStakes ?? []}
                />
              </div>
            )}

            {market.contractAddress && (
              <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-5">
                <p className="text-[15px] font-semibold text-[#F8FAFC] mb-4">Place prediction</p>
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
              </div>
            )}

            {!market.contractAddress && (
              <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] p-5">
                <p className="text-[13px] text-[#64748B] text-center">
                  Market not yet deployed on-chain. The creator's transaction may be pending.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
