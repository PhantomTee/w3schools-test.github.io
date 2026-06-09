import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const HOW_IT_WORKS = [
  { title: 'Connect wallet + X account',  desc: 'Use any EVM wallet and connect your X account to unlock tweet data.' },
  { title: 'Choose a tweet',              desc: 'Pick any of your recent eligible tweets. Tweets must be fresh and meet minimum metrics.' },
  { title: 'Select metric and duration',  desc: 'Predict final views, likes, reposts, or replies. Set a 1h to 48h window.' },
  { title: 'GenLayer designs ranges',     desc: 'A Python intelligent contract on GenLayer Studionet analyzes the tweet and designs time-aware ranges calibrated to realistic outcomes.' },
  { title: 'Stake USDC on a range',       desc: 'Arc-native USDC. No bridges, no wrapping. Place your prediction by staking into a range.' },
  { title: 'Market locks at expiry',      desc: 'When the window closes, the market locks. X API fetches the final metric value.' },
  { title: 'Claim winnings',             desc: 'Winners claim proportional share of the pool. GenLayer acts as a fallback oracle if the X API result is disputed.' },
]

const PILLARS = [
  { title: 'GenLayer Ranges',    desc: 'Python intelligent contracts design range brackets calibrated to tweet velocity. No static tiers.' },
  { title: 'X API Truth',        desc: 'Resolution uses the real X API. Verified final metrics, not estimates.' },
  { title: 'Pari-mutuel pools',  desc: 'No house. Stakes pool together. Odds shift with every new prediction. Pure peer-to-peer.' },
]

const MOCK_RANGES = ['0 – 10k', '10k – 100k', '100k – 1M', '1M+']
const MOCK_PAYOUTS = ['—', '2.3x', '4.1x', '—']

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Header />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-6 pt-20 pb-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left */}
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-5">
              Arc-native prediction markets
            </p>
            <h1 className="text-[36px] lg:text-[52px] font-semibold leading-[1.08] tracking-tight mb-5">
              Predict tweet metrics.<br />
              <span className="text-[var(--blue-bright)]">Win USDC.</span>
            </h1>
            <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed mb-8 max-w-[480px]">
              Xen turns any tweet into a pari-mutuel range market. Stake USDC on where the metric lands —
              views, likes, reposts, replies. GenLayer designs the ranges. X API resolves the truth.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/feed"
                className="inline-block px-6 py-3 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-medium text-[15px] hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all"
              >
                Start predicting
              </Link>
              <Link
                href="/create"
                className="inline-block px-6 py-3 rounded-[14px] border border-[var(--border-soft)] text-[var(--text-secondary)] font-medium text-[15px] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all"
              >
                Create a market
              </Link>
            </div>
          </div>

          {/* Right — CSS phone mockup */}
          <div className="hidden lg:flex justify-center mt-0">
            <div className="relative">
              {/* glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-[300px] h-[300px] rounded-full opacity-[0.13]"
                  style={{ background: '#2563EB', filter: 'blur(80px)' }}
                />
              </div>

              {/* phone frame */}
              <div
                className="relative w-[270px] bg-[var(--bg-card)] rounded-[36px] border border-[var(--border-soft)] overflow-hidden"
                style={{ height: 540, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
              >
                {/* notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-[var(--bg-muted)] rounded-full" />

                {/* mock status row */}
                <div className="mt-8 mx-3">
                  <div className="flex gap-1.5 mb-2">
                    <div className="h-1 w-8 rounded-full bg-[var(--blue-bright)]" />
                    <div className="h-1 w-1.5 rounded-full bg-[var(--text-muted)]/50" />
                    <div className="h-1 w-1.5 rounded-full bg-[var(--text-muted)]/50" />
                  </div>

                  {/* mock card */}
                  <div className="rounded-[20px] overflow-hidden border border-[var(--border-soft)]">
                    {/* header */}
                    <div className="h-[130px] bg-gradient-to-br from-[#07111F] via-[#0B1220] to-[#05070B] relative">
                      <div
                        className="absolute inset-0 opacity-[0.12]"
                        style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #2563EB 0%, transparent 60%)' }}
                      />
                      <div className="absolute top-3 right-3">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-medium">Open</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[9px] text-white/60 mb-0.5">@elonmusk</p>
                        <p className="text-[10px] text-white/80 line-clamp-2 font-medium">
                          &ldquo;Just dropped something massive on X today…&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* body */}
                    <div className="bg-[var(--bg-card)] p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-primary)] mb-2 leading-tight">
                        What will this tweet&apos;s views be in 24h?
                      </p>
                      <div className="space-y-1 mb-2">
                        {MOCK_RANGES.map((label, i) => (
                          <div
                            key={i}
                            className={`flex justify-between px-2 py-1 rounded-[8px] border text-[9px] ${
                              i === 2
                                ? 'border-[var(--border-active)] bg-[var(--blue-primary)]/10'
                                : 'border-[var(--border-soft)] bg-[var(--bg-elevated)]'
                            }`}
                          >
                            <span className={i === 2 ? 'text-[var(--blue-bright)]' : 'text-[var(--text-secondary)]'}>
                              {label}
                            </span>
                            <span className={`font-semibold tabular-nums ${i === 2 ? 'text-[var(--blue-bright)]' : 'text-[var(--text-muted)]'}`}>
                              {MOCK_PAYOUTS[i]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="h-6 rounded-[8px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-secondary)] py-20">
        <div className="max-w-[760px] mx-auto px-6">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)] mb-10">How it works</h2>
          <div>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex items-start gap-4 mb-7 last:mb-0">
                <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--blue-primary)]/10 border border-[var(--blue-primary)]/20 flex items-center justify-center text-[11px] font-semibold text-[var(--blue-bright)]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-[var(--text-primary)] mb-0.5">{step.title}</p>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature pillars ──────────────────────────────────────────────── */}
      <section className="max-w-[900px] mx-auto px-6 py-16">
        <h2 className="text-[28px] font-semibold text-[var(--text-primary)] mb-8">Built different.</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PILLARS.map((p, i) => (
            <div key={i} className="bg-[var(--bg-elevated)] rounded-[20px] p-6 border border-[var(--border-soft)]">
              <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">{p.title}</p>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="max-w-[520px] mx-auto px-6">
          <h2 className="text-[32px] font-semibold text-[var(--text-primary)] mb-3">Ready to predict?</h2>
          <p className="text-[15px] text-[var(--text-muted)] mb-8 leading-relaxed">
            Connect your wallet, link your X account, and start earning from what you already know about the timeline.
          </p>
          <Link
            href="/feed"
            className="inline-block px-8 py-3.5 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-medium text-[16px] hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all"
          >
            Open the app
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
