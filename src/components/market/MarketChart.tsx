'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MarketWithPools } from '@/types/market';

interface Props {
  market: MarketWithPools;
}

interface ChartEntry {
  label: string;
  usdc: number;
}

interface TooltipPayloadItem {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-[10px] px-3 py-2 text-[12px]"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
    >
      <div className="text-[var(--text-muted)] mb-0.5">{label}</div>
      <div className="text-[var(--text-primary)] font-semibold">
        {payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
      </div>
    </div>
  );
}

export default function MarketChart({ market }: Props) {
  const poolMap: Record<number, number> = {};
  for (const p of market.pools) {
    poolMap[p.rangeIndex] = Number(BigInt(p.amount)) / 1_000_000;
  }

  const data: ChartEntry[] = market.ranges.map((r, i) => ({
    label: r.label,
    usdc: poolMap[i] ?? 0,
  }));

  const totalPool = data.reduce((acc, d) => acc + d.usdc, 0);

  if (totalPool === 0) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center">
        <span className="text-[var(--text-muted)] text-[13px]">
          No stakes yet — be the first to predict.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="usdc" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={market.winningRangeIndex === i ? '#22C55E' : '#2563EB'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
