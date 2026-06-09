import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const HOW_IT_WORKS = [
  { title: 'Connect wallet',          desc: 'Sign in with any EVM wallet. One click, no email, no password.' },
  { title: 'Choose a tweet',          desc: 'Pick any of your recent eligible tweets. Must be fresh and meet minimum metrics.' },
  { title: 'Select metric + duration', desc: 'Predict final views, likes, reposts, or replies. Set a 1h–48h window.' },
  { title: 'GenLayer designs ranges', desc: 'A Python intelligent contract on GenLayer Studionet analyzes the tweet and designs time-aware range brackets.' },
  { title: 'Stake USDC on a range',   desc: 'Arc-native USDC. No bridges. Place your prediction by staking into a range.' },
  { title: 'Market locks at expiry',  desc: 'Window closes, market locks, X API fetches the final metric value.' },
  { title: 'Claim winnings',          desc: 'Winners claim proportional share of the pool. GenLayer acts as fallback oracle if disputed.' },
]

const PILLARS = [
  { label: '01', title: 'GenLayer Ranges',   desc: 'Python intelligent contracts design range brackets calibrated to tweet velocity. No static tiers.' },
  { label: '02', title: 'X API Truth',       desc: 'Resolution uses the real X API. Verified final metrics, not estimates.' },
  { label: '03', title: 'Pari-mutuel pools', desc: 'No house. Stakes pool together. Odds shift with every new prediction. Pure peer-to-peer.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 pt-14 pb-20">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--text-muted)] mb-6">
          Arc-native prediction markets
        </p>
        <h1 className="font-display text-[clamp(52px,10vw,120px)] leading-[0.92] tracking-[-0.02em] uppercase mb-8 max-w-[900px]">
          Predict tweet metrics.<br />Win USDC.
        </h1>
        <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed mb-10 max-w-[540px]">
          Xen turns any tweet into a pari-mutuel range market. Stake USDC on where the metric lands —
          views, likes, reposts, replies. GenLayer designs the ranges. X API resolves the truth.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/feed"
            className="inline-flex items-center h-12 px-7 rounded-[8px] bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold text-[15px] hover:opacity-85 transition-opacity active:scale-[0.98]"
          >
            Start predicting
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center h-12 px-7 rounded-[8px] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-[15px] hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            Create a market
          </Link>
        </div>
      </section>

      {/* ── Marquee divider ──────────────────────────────────────────────── */}
      <div className="border-y border-[var(--border-strong)] py-4 overflow-hidden">
        <p className="font-display text-[13px] tracking-[0.3em] uppercase text-[var(--text-muted)] text-center">
          Arc Network · GenLayer · X API · USDC · Pari-mutuel · No house
        </p>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-[900px] mx-auto px-5 py-20">
        <h2 className="font-display text-[clamp(36px,6vw,72px)] leading-[0.92] uppercase mb-14">
          How it works
        </h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex items-start gap-5">
              <span className="shrink-0 font-display text-[28px] text-[var(--text-muted)] leading-none mt-0.5 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1 uppercase tracking-wide">{step.title}</p>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature pillars ──────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border-strong)]">
        <div className="max-w-[900px] mx-auto px-5 py-20">
          <h2 className="font-display text-[clamp(36px,6vw,72px)] leading-[0.92] uppercase mb-14">
            Built different.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <div key={i} className="bg-[var(--bg-card)] rounded-[4px] p-6 border border-[var(--border-soft)]">
                <p className="font-display text-[13px] text-[var(--text-muted)] mb-3 tracking-widest">{p.label}</p>
                <p className="text-[16px] font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">{p.title}</p>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border-strong)] py-24 text-center">
        <div className="max-w-[700px] mx-auto px-5">
          <h2 className="font-display text-[clamp(48px,8vw,96px)] leading-[0.92] uppercase mb-8">
            Ready to predict?
          </h2>
          <p className="text-[16px] text-[var(--text-muted)] mb-10 leading-relaxed">
            Connect your wallet and start earning from what you already know about the timeline.
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center h-14 px-10 rounded-[8px] bg-[var(--accent-primary)] text-[var(--accent-text)] font-bold text-[16px] tracking-wide uppercase hover:opacity-85 transition-opacity active:scale-[0.98]"
          >
            Open the app
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
