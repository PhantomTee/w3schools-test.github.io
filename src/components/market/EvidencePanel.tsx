'use client';

import { MarketWithPools } from '@/types/market';

interface Props {
  market: MarketWithPools;
}

function formatMetric(value: string | number | null): string {
  if (value === null || value === undefined) return 'Pending';
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function truncateAddress(addr: string | null): string {
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface RowProps {
  label: string;
  value: React.ReactNode;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span
        className="text-[11px] uppercase tracking-wider shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <span
        className="text-[13px] text-right break-all"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function EvidencePanel({ market }: Props) {
  const createdDate = new Date(market.createdAt).toLocaleString();
  const expiresDate = new Date(market.expiresAt).toLocaleString();

  const metricLabel = market.metricType
    .replace('FINAL_', '')
    .charAt(0)
    .toUpperCase()
    + market.metricType.replace('FINAL_', '').slice(1).toLowerCase();

  return (
    <div
      className="rounded-[16px] p-4 border space-y-2"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-soft)',
      }}
    >
      <div
        className="text-[11px] uppercase tracking-wider mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Evidence
      </div>

      <Row
        label="Tweet"
        value={
          <a
            href={`https://twitter.com/i/web/status/${market.tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-bright)' }}
          >
            {market.tweetId}
          </a>
        }
      />

      {market.xUsername && (
        <Row
          label="Creator"
          value={
            <a
              href={`https://twitter.com/${market.xUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-bright)' }}
            >
              @{market.xUsername}
            </a>
          }
        />
      )}

      <Row label="Created" value={createdDate} />
      <Row label="Expires" value={expiresDate} />

      <Row
        label={`Start ${metricLabel}`}
        value={formatMetric(market.startValue)}
      />

      <Row
        label={`Final ${metricLabel}`}
        value={
          market.finalValue !== null
            ? formatMetric(market.finalValue)
            : 'Pending'
        }
      />

      {market.contractAddress && (
        <Row
          label="Contract"
          value={
            <span
              className="font-mono text-[12px]"
              title={market.contractAddress}
            >
              {truncateAddress(market.contractAddress)}
            </span>
          }
        />
      )}

      <Row label="Resolution" value="X API + GenLayer fallback" />
    </div>
  );
}
