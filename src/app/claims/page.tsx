'use client'

import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    n: 1,
    text: 'Market expires and the final metric value is fetched directly from the X API.',
  },
  {
    n: 2,
    text: 'GenLayer verifies the result on-chain. Anyone may open a dispute within 24 hours of resolution.',
  },
  {
    n: 3,
    text: 'Winning range holders claim their proportional share of the pool, minus the 1% protocol fee.',
  },
]

export default function ClaimsPage() {
  return (
    <AppShell>
      <div className="max-w-[600px] mx-auto px-4 pt-8 pb-12">

        {/* Header */}
        <h1
          style={{ fontSize: 22 }}
          className="text-[var(--text-primary)] font-semibold mb-1"
        >
          Claims
        </h1>
        <p
          style={{ fontSize: 14 }}
          className="text-[var(--text-muted)] mb-6"
        >
          Your claimable winnings from resolved markets.
        </p>

        {/* Info box */}
        <div className="rounded-[16px] border border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.06)] px-4 py-3.5 mb-6">
          <p style={{ fontSize: 13 }} className="text-[var(--text-secondary)] leading-relaxed">
            After a market resolves, winning positions become claimable here.
            Connect your wallet and ensure your X account is linked to see your
            positions.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-soft)] mb-6" />

        {/* How claims work */}
        <h2
          style={{ fontSize: 14 }}
          className="text-[var(--text-secondary)] font-semibold mb-4"
        >
          How claims work
        </h2>

        <div className="flex flex-col gap-4 mb-8">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-3 items-start">
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                }}
              >
                {step.n}
              </span>
              <p
                style={{ fontSize: 13 }}
                className="text-[var(--text-secondary)] leading-relaxed pt-0.5"
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button variant="outline" asChild>
          <Link href="/markets">Go to Markets</Link>
        </Button>
      </div>
    </AppShell>
  )
}
