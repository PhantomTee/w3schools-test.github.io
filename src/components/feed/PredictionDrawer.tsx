'use client'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MarketWithPools } from '@/types/market'

const STAKE_PRESETS = [5, 10, 25]

interface PredictionDrawerProps {
  open:               boolean
  onClose:            () => void
  market:             MarketWithPools
  initialRangeIndex?: number
}

export function PredictionDrawer({
  open,
  onClose,
  market,
  initialRangeIndex = 0,
}: PredictionDrawerProps) {
  const { isConnected } = useAccount()
  const [selectedRange, setSelectedRange] = useState(initialRangeIndex)
  const [stake,         setStake]         = useState(10)
  const [customStake,   setCustomStake]   = useState('')
  const [loading,       setLoading]       = useState(false)
  const [confirmed,     setConfirmed]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [sharing,       setSharing]       = useState(false)
  const [shared,        setShared]        = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedRange(initialRangeIndex)
      setConfirmed(false)
      setError(null)
      setShared(false)
    }
  }, [open, initialRangeIndex])

  const ranges     = market.ranges ?? []
  const totalPool  = Number(BigInt(market.totalStaked ?? '0')) / 1_000_000

  const poolMap = new Map<number, number>()
  for (const p of market.pools ?? []) {
    poolMap.set(p.rangeIndex, Number(BigInt(p.amount)) / 1_000_000)
  }

  const range     = ranges[selectedRange]
  const rangePool = poolMap.get(selectedRange) ?? 0

  const effectiveStake = customStake ? parseFloat(customStake) || 0 : stake
  const newRangePool   = rangePool + effectiveStake
  const newTotalPool   = totalPool + effectiveStake
  const impliedPayout  = newRangePool > 0 ? newTotalPool / newRangePool : 0
  const estimatedClaim = effectiveStake * impliedPayout

  async function handlePlace() {
    if (!isConnected) { setError('Connect your wallet first.'); return }
    if (effectiveStake <= 0) { setError('Enter a valid stake amount.'); return }
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 800))
      setConfirmed(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleShareOnX() {
    if (sharing || shared) return
    setSharing(true)
    const metric  = market.metricType.replace('FINAL_', '').toLowerCase()
    const text    = `Just placed a prediction on Xen: "${range?.label}" for ${market.durationHours}h ${metric} — staked ${effectiveStake} USDC at ${impliedPayout.toFixed(1)}x. xen.markets`
    try {
      await fetch('/api/x/post', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })
      setShared(true)
    } catch {
      // silent — sharing is optional
    } finally {
      setSharing(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {confirmed ? (
        <div className="px-5 py-6 space-y-4">
          <div className="text-center pb-2">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Prediction placed</p>
            <h3 className="text-[20px] font-semibold text-[var(--text-primary)]">Position active</h3>
          </div>

          <div className="space-y-2 bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)]">
            <Row label="Market"                value={`${market.metricType.replace('FINAL_', '').toLowerCase()} in ${market.durationHours}h`} />
            <Row label="Range"                 value={range?.label ?? '—'} />
            <Row label="Stake"                 value={`${effectiveStake} USDC`} />
            <Row label="Implied payout"        value={`${impliedPayout.toFixed(1)}x`} highlight />
            <Row label="Est. claim if correct" value={`${estimatedClaim.toFixed(2)} USDC`} highlight />
          </div>

          <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
            Resolution via X API. GenLayer handles fallback if disputed.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={handleShareOnX}
              disabled={sharing || shared}
            >
              {shared ? 'Shared' : sharing ? 'Sharing…' : 'Share on X'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-5">
          {/* Range selector */}
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Select range</p>
            <div className="space-y-1.5">
              {ranges.map((r, i) => {
                const rPool   = poolMap.get(i) ?? 0
                const rPayout = rPool > 0
                  ? (totalPool + effectiveStake) / (rPool + (i === selectedRange ? effectiveStake : 0))
                  : 0
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedRange(i)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] border transition-all text-left',
                      selectedRange === i
                        ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/[0.08]'
                        : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] hover:border-[rgba(16,185,129,0.25)]'
                    )}
                  >
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{r.label}</span>
                    <div className="flex items-center gap-2 text-[12px]">
                      {selectedRange === i && (
                        <span className="text-[10px] text-[var(--accent-primary)] font-medium">Selected</span>
                      )}
                      <span className="text-[var(--text-muted)] tabular-nums">{rPool.toFixed(0)} USDC</span>
                      <span className={cn(
                        'font-semibold tabular-nums min-w-[32px] text-right',
                        selectedRange === i ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
                      )}>
                        {rPayout > 0 ? `${rPayout.toFixed(1)}x` : '—'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stake */}
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Stake</p>
            <div className="flex gap-2 mb-2">
              {STAKE_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => { setStake(p); setCustomStake('') }}
                  className={cn(
                    'flex-1 py-2 rounded-[10px] text-[13px] font-medium border transition-all',
                    stake === p && !customStake
                      ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/[0.10] text-[var(--accent-primary)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[rgba(16,185,129,0.25)]'
                  )}
                >
                  {p} USDC
                </button>
              ))}
              <input
                type="number"
                min="1"
                placeholder="Custom"
                value={customStake}
                onChange={e => { setCustomStake(e.target.value); setStake(0) }}
                className={cn(
                  'flex-1 py-2 px-3 rounded-[10px] text-[13px] bg-[var(--bg-elevated)] border outline-none',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                  customStake
                    ? 'border-[var(--border-active)]'
                    : 'border-[var(--border-soft)] focus:border-[rgba(16,185,129,0.45)]'
                )}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[var(--bg-elevated)] rounded-[14px] p-4 border border-[var(--border-soft)] space-y-2">
            <Row label="Selected range"         value={range?.label ?? '—'} />
            <Row label="Current implied payout" value={impliedPayout > 0 ? `${impliedPayout.toFixed(1)}x` : '—'} />
            <Row label="Est. claim if correct"  value={estimatedClaim > 0 ? `${estimatedClaim.toFixed(2)} USDC` : '—'} highlight />
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Payouts are pool-based and may change before confirmation.
            Resolution via X API first. GenLayer fallback if disputed.
          </p>

          {error && (
            <p className="text-[12px] text-[var(--xen-red)] bg-[var(--xen-red)]/[0.06] px-3 py-2 rounded-[10px]">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="xen"
              size="lg"
              className="flex-1"
              onClick={handlePlace}
              disabled={loading || effectiveStake <= 0}
            >
              {loading ? 'Placing...' : 'Place Prediction'}
            </Button>
            <Button variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <span className={cn(
        'text-[13px] font-medium tabular-nums',
        highlight ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
      )}>{value}</span>
    </div>
  )
}
