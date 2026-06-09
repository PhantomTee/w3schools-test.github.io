import { MarketWithPools } from '@/types/market';

interface Props {
  report: MarketWithPools['genLayerReport'];
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
      <span className="text-[13px] text-right">{value}</span>
    </div>
  );
}

function qualityColor(score: number): string {
  if (score >= 70) return 'var(--xen-green)';
  if (score >= 40) return 'var(--xen-amber)';
  return 'var(--xen-red)';
}

function riskColor(score: number): string {
  if (score <= 3) return 'var(--xen-green)';
  if (score <= 6) return 'var(--xen-amber)';
  return 'var(--xen-red)';
}

export default function GenLayerPanel({ report }: Props) {
  if (!report) return null;

  const quality = typeof report.qualityScore === 'number' ? report.qualityScore : null;
  const risk = typeof report.riskScore === 'number' ? report.riskScore : null;
  const reason: string | null =
    typeof report.reason === 'string' ? report.reason : null;
  const approved: boolean | null =
    typeof report.approved === 'boolean' ? report.approved : null;

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
        GenLayer range design
      </div>

      {quality !== null && (
        <Row
          label="Quality score"
          value={
            <span
              className="font-semibold tabular-nums"
              style={{ color: qualityColor(quality) }}
            >
              {quality} / 100
            </span>
          }
        />
      )}

      {risk !== null && (
        <Row
          label="Risk score"
          value={
            <span
              className="font-semibold tabular-nums"
              style={{ color: riskColor(risk) }}
            >
              {risk} / 10
            </span>
          }
        />
      )}

      {reason && (
        <Row
          label="Reason"
          value={
            <span
              className="text-[12px] text-right"
              style={{ color: 'var(--text-secondary)' }}
            >
              {reason}
            </span>
          }
        />
      )}

      {approved !== null && (
        <Row
          label="Approved"
          value={
            <span
              className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: approved
                  ? 'rgba(34,197,94,0.15)'
                  : 'rgba(239,68,68,0.15)',
                color: approved ? 'var(--xen-green)' : 'var(--xen-red)',
              }}
            >
              {approved ? 'Yes' : 'No'}
            </span>
          }
        />
      )}
    </div>
  );
}
