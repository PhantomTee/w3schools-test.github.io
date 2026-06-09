'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { MarketWithPools } from '@/types/market';

interface Props {
  market: MarketWithPools;
  onSuccess?: () => void;
}

const STAKE_PRESETS = [5, 10, 25];

function buildQuestion(market: MarketWithPools): string {
  const metric = market.metricType
    .replace('FINAL_', '')
    .toLowerCase();
  return `Final ${metric} on this tweet?`;
}

function calcImpliedPayout(
  selectedRangeIndex: number,
  stakeUsdc: number,
  poolMap: Record<number, number>,
  totalPool: number,
  protocolFeeBps: number
): number {
  const rangePool = poolMap[selectedRangeIndex] ?? 0;
  const newRangePool = rangePool + stakeUsdc;
  const newTotalPool = totalPool + stakeUsdc;
  if (newRangePool === 0) return 0;
  const feeMultiplier = 1 - protocolFeeBps / 10_000;
  return (stakeUsdc / newRangePool) * newTotalPool * feeMultiplier;
}

export default function PredictionPanel({ market, onSuccess }: Props) {
  const { isConnected } = useAccount();
  const [selectedRange, setSelectedRange] = useState<number | null>(null);
  const [stake, setStake] = useState<number>(10);
  const [customStake, setCustomStake] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poolMap: Record<number, number> = {};
  for (const p of market.pools) {
    poolMap[p.rangeIndex] = Number(BigInt(p.amount)) / 1_000_000;
  }

  const totalPool = Number(BigInt(market.totalStaked)) / 1_000_000;
  const question = buildQuestion(market);

  const activeStake =
    customStake !== '' ? Number(customStake) : stake;

  const impliedPayout =
    selectedRange !== null
      ? calcImpliedPayout(
          selectedRange,
          activeStake,
          poolMap,
          totalPool,
          market.protocolFeeBps
        )
      : 0;

  const estClaim = impliedPayout;

  async function handleSubmit() {
    if (selectedRange === null || activeStake <= 0) return;
    setLoading(true);
    setError(null);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      setConfirmed(true);
      onSuccess?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed.');
    } finally {
      setLoading(false);
    }
  }

  const isOpen = market.state === 'OPEN';

  if (confirmed && selectedRange !== null) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[20px] p-5">
        <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
          Prediction placed
        </div>
        <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
          {market.ranges[selectedRange].label}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--text-muted)]">Staked</span>
            <span className="text-[var(--text-primary)] tabular-nums">
              {activeStake.toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--text-muted)]">Implied payout</span>
            <span className="text-[var(--xen-green)] tabular-nums">
              {impliedPayout.toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--text-muted)]">Est. claim</span>
            <span className="text-[var(--text-primary)] tabular-nums">
              {estClaim.toFixed(2)} USDC
            </span>
          </div>
        </div>
        <button
          className="mt-4 w-full text-[13px] text-[var(--text-muted)] underline underline-offset-2"
          onClick={() => {
            setConfirmed(false);
            setSelectedRange(null);
            setCustomStake('');
            setStake(10);
          }}
        >
          Place another prediction
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[20px] p-5">
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
        Place prediction
      </div>
      <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
        {question}
      </div>

      {/* Range selector */}
      <div className="space-y-1.5 mb-4">
        {market.ranges.map((range, i) => {
          const rangePool = poolMap[i] ?? 0;
          const newRangePool = rangePool + (selectedRange === i ? activeStake : 0);
          const newTotalPool = totalPool + (selectedRange === i ? activeStake : 0);
          const payout =
            newRangePool > 0
              ? ((activeStake / newRangePool) * newTotalPool * (1 - market.protocolFeeBps / 10_000)).toFixed(2)
              : '—';

          const isSelected = selectedRange === i;
          return (
            <button
              key={i}
              disabled={!isOpen}
              onClick={() => setSelectedRange(i)}
              className={[
                'w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] border text-left transition-colors',
                isSelected
                  ? 'border-[var(--border-active)] bg-[var(--bg-elevated)]'
                  : 'border-[var(--border-soft)] bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)]',
                !isOpen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">
                  {range.label}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {rangePool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC in pool
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-[var(--text-secondary)] tabular-nums">
                  {payout !== '—' ? `${payout}x est.` : '—'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stake presets */}
      <div className="mb-3">
        <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Stake (USDC)
        </div>
        <div className="flex gap-2 mb-2">
          {STAKE_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setStake(p);
                setCustomStake('');
              }}
              className={[
                'flex-1 py-1.5 rounded-[10px] border text-[13px] font-medium transition-colors',
                stake === p && customStake === ''
                  ? 'border-[var(--border-active)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'border-[var(--border-soft)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          placeholder="Custom amount"
          value={customStake}
          onChange={(e) => setCustomStake(e.target.value)}
          className="w-full bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-[10px] px-3 py-1.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
        />
      </div>

      {/* Summary */}
      {selectedRange !== null && (
        <div className="bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-[12px] px-3 py-2.5 mb-3 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-[var(--text-muted)]">Range</span>
            <span className="text-[var(--text-primary)]">
              {market.ranges[selectedRange].label}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-[var(--text-muted)]">Implied payout</span>
            <span className="text-[var(--xen-green)] tabular-nums">
              {impliedPayout.toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-[var(--text-muted)]">Est. claim</span>
            <span className="text-[var(--text-primary)] tabular-nums">
              {estClaim.toFixed(2)} USDC
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 text-[12px] text-[var(--xen-red)]">{error}</div>
      )}

      {isConnected ? (
        <button
          disabled={!isOpen || selectedRange === null || activeStake <= 0 || loading}
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-[12px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, var(--blue-primary), var(--blue-bright))',
          }}
        >
          {loading ? 'Confirming...' : 'Place Prediction'}
        </button>
      ) : (
        <button
          className="w-full py-2.5 rounded-[12px] text-[14px] font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--blue-primary), var(--blue-bright))',
          }}
        >
          Connect Wallet
        </button>
      )}

      {!isOpen && (
        <div className="mt-2 text-center text-[12px] text-[var(--text-muted)]">
          Market is {market.state.toLowerCase()} — predictions closed.
        </div>
      )}
    </div>
  );
}
