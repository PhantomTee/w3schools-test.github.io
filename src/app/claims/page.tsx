'use client'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ClaimRefundButton } from '@/components/markets/ClaimRefundButton'
import { Badge } from '@/components/ui/badge'
import { formatCount, metricLabel } from '@/lib/utils'
import Link from 'next/link'

export default function ClaimsPage() {
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
  })
  const me = meData?.user

  const { data: resolvedData, isLoading } = useQuery({
    queryKey:  ['markets', 'resolved'],
    queryFn:   () => fetch('/api/markets?filter=resolved').then(r => r.json()),
    enabled:   !!me,
    staleTime: 60_000,
  })

  const { data: voidedData } = useQuery({
    queryKey:  ['markets', 'voided'],
    queryFn:   () => fetch('/api/markets?filter=all').then(r => r.json()),
    enabled:   !!me,
    staleTime: 60_000,
  })

  if (!me) {
    return (
      <AppShell>
        <div className="px-5 sm:px-8 py-16 max-w-2xl mx-auto text-center space-y-4">
          <p className="text-[20px] font-semibold text-[#F8FAFC]">Connect your wallet</p>
          <p className="text-[15px] text-[#64748B]">
            Connect your wallet to view claimable payouts.
          </p>
        </div>
      </AppShell>
    )
  }

  const resolved = (resolvedData?.markets ?? []) as any[]
  const allMarkets = (voidedData?.markets ?? []) as any[]
  const voided = allMarkets.filter((m: any) => m.state === 'VOIDED' || m.state === 'CANCELLED')

  const claimable = resolved.filter((m: any) =>
    m.contractAddress &&
    m.userStakes?.some((s: any) => s.rangeIndex === m.winningRangeIndex && !s.claimed && BigInt(s.amount) > 0n)
  )

  const refundable = voided.filter((m: any) =>
    m.contractAddress &&
    m.userStakes?.some((s: any) => BigInt(s.amount) > 0n)
  )

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Claims</h1>
          <p className="text-[14px] text-[#64748B]">Resolved winning markets and refundable stakes</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-[24px] shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Claimable */}
            <div>
              <h2 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">
                Claimable
                {claimable.length > 0 && (
                  <span className="ml-2 text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                    {claimable.length}
                  </span>
                )}
              </h2>
              {claimable.length === 0 ? (
                <div className="rounded-[20px] bg-[#080D14] border border-white/[0.04] py-10 text-center">
                  <p className="text-[14px] text-[#64748B]">No claimable payouts yet.</p>
                  <p className="text-[12px] text-[#64748B] mt-1">Resolved winning markets will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {claimable.map((m: any) => {
                    const winningStake = m.userStakes?.find((s: any) => s.rangeIndex === m.winningRangeIndex)
                    const stakeAmt     = winningStake ? (Number(winningStake.amount) / 1e6).toFixed(2) : '0.00'
                    const range        = m.ranges?.[m.winningRangeIndex]
                    return (
                      <div key={m.id} className="rounded-[20px] bg-[#0B1220] border border-[rgba(34,197,94,0.20)] p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <p className="text-[12px] text-[#64748B] mb-1">
                              {m.xUsername ? `@${m.xUsername}` : 'Unknown'} · Final {metricLabel(m.metricType)} · {m.durationHours}h
                            </p>
                            <p className="text-[15px] font-semibold text-[#F8FAFC]">
                              What will the final total {metricLabel(m.metricType).toLowerCase()} be?
                            </p>
                          </div>
                          <Badge variant="blue">Resolved</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 py-3 border-y border-white/[0.05] mb-4 text-[13px]">
                          <div>
                            <p className="text-[12px] text-[#64748B] mb-1">Winning range</p>
                            <p className="text-[#22C55E] font-medium">{range?.label ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-[12px] text-[#64748B] mb-1">Final value</p>
                            <p className="text-[#F8FAFC] font-medium tabular-nums">{formatCount(Number(m.finalValue))}</p>
                          </div>
                          <div>
                            <p className="text-[12px] text-[#64748B] mb-1">Your stake</p>
                            <p className="text-[#F8FAFC] font-medium tabular-nums">{stakeAmt} USDC</p>
                          </div>
                        </div>
                        <ClaimRefundButton
                          contractAddress={m.contractAddress}
                          state={m.state}
                          winningRangeIndex={m.winningRangeIndex}
                          userStakes={m.userStakes ?? []}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Refundable */}
            {refundable.length > 0 && (
              <div>
                <h2 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">
                  Refundable
                  <span className="ml-2 text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                    {refundable.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {refundable.map((m: any) => {
                    const totalStake = m.userStakes?.reduce((s: number, u: any) => s + Number(u.amount), 0) ?? 0
                    return (
                      <div key={m.id} className="rounded-[20px] bg-[#0B1220] border border-white/[0.06] p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <p className="text-[12px] text-[#64748B] mb-1">
                              {m.xUsername ? `@${m.xUsername}` : 'Unknown'} · {metricLabel(m.metricType)} · {m.durationHours}h
                            </p>
                            <p className="text-[15px] font-semibold text-[#F8FAFC]">
                              What will the final total {metricLabel(m.metricType).toLowerCase()} be?
                            </p>
                          </div>
                          <Badge variant="amber">{m.state}</Badge>
                        </div>
                        <div className="flex items-center justify-between mb-4 text-[13px]">
                          <span className="text-[#64748B]">Your stake</span>
                          <span className="text-[#F8FAFC] font-medium tabular-nums">
                            {(totalStake / 1e6).toFixed(2)} USDC
                          </span>
                        </div>
                        <ClaimRefundButton
                          contractAddress={m.contractAddress}
                          state={m.state}
                          winningRangeIndex={m.winningRangeIndex}
                          userStakes={m.userStakes ?? []}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Browse resolved */}
            <div className="pt-4 border-t border-white/[0.04]">
              <h2 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">All resolved markets</h2>
              {resolved.length === 0 ? (
                <div className="rounded-[20px] bg-[#080D14] border border-white/[0.04] py-10 text-center">
                  <p className="text-[14px] text-[#64748B]">No resolved markets yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resolved.map((m: any) => (
                    <Link key={m.id} href={`/market/${m.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#080D14] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                        <div>
                          <p className="text-[13px] font-medium text-[#F8FAFC]">
                            Final {metricLabel(m.metricType)} · {m.durationHours}h
                          </p>
                          <p className="text-[12px] text-[#64748B] mt-0.5">
                            {m.xUsername ? `@${m.xUsername}` : 'Unknown'} ·{' '}
                            Final: {m.finalValue ? formatCount(Number(m.finalValue)) : '—'}
                          </p>
                        </div>
                        <span className="text-[12px] text-[#3B82F6]">View</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
