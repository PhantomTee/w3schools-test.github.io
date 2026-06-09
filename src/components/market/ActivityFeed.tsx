import { MarketWithPools } from '@/types/market';

interface Props {
  bets: MarketWithPools['recentBets'];
  ranges: MarketWithPools['ranges'];
}

function truncateWallet(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function ActivityFeed({ bets, ranges }: Props) {
  return (
    <div>
      <div
        className="text-[11px] uppercase tracking-wider mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Activity
      </div>

      {!bets || bets.length === 0 ? (
        <div
          className="text-[13px] text-center py-4"
          style={{ color: 'var(--text-muted)' }}
        >
          No predictions yet.
        </div>
      ) : (
        <div>
          {bets.map((bet, i) => {
            const amountUsdc =
              Number(BigInt(bet.amount)) / 1_000_000;
            const rangeLabel =
              ranges[bet.rangeIndex]?.label ?? `Range ${bet.rangeIndex}`;
            return (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b last:border-0"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div>
                  <div
                    className="text-[12px] font-mono"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {truncateWallet(bet.walletAddress)}
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {rangeLabel}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[13px] tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {amountUsdc.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    USDC
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {relativeTime(bet.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
