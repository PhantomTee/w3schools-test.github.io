import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroText } from '@/components/landing/HeroText'

const HOW_IT_WORKS = [
  { title: 'Connect wallet',            desc: 'Sign in with any EVM wallet. One click, no email, no password.' },
  { title: 'Choose a tweet',            desc: 'Pick any of your recent eligible tweets. Must be fresh and meet minimum metrics.' },
  { title: 'Select metric + duration',  desc: 'Predict final views, likes, reposts, or replies. Set a 1h–48h window.' },
  { title: 'GenLayer designs ranges',   desc: 'A Python intelligent contract on GenLayer Studionet analyzes the tweet and designs time-aware range brackets.' },
  { title: 'Stake USDC on a range',     desc: 'Arc-native USDC. No bridges. Place your prediction by staking into a range.' },
  { title: 'Market locks at expiry',    desc: 'Window closes, market locks, X API fetches the final metric value.' },
  { title: 'Claim winnings',            desc: 'Winners claim proportional share of the pool. GenLayer acts as fallback oracle if disputed.' },
]

const sketchBtn =
  'inline-flex items-center justify-center rounded-[4px] bg-[var(--paper)] text-[var(--ink)] ' +
  'border-2 border-[var(--ink)] [box-shadow:3px_3px_0_var(--ink)] hover:[box-shadow:4px_4px_0_var(--ink)] ' +
  'active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:1px_1px_0_var(--ink)] ' +
  '[filter:url(#hand-draw)] transition-all duration-100'

const sketchBtnFilled =
  'inline-flex items-center justify-center rounded-[4px] bg-[var(--ink)] text-[var(--paper)] ' +
  'border-2 border-[var(--ink)] [box-shadow:3px_3px_0_var(--ink)] hover:[box-shadow:4px_4px_0_var(--ink)] ' +
  'active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:1px_1px_0_var(--ink)] ' +
  '[filter:url(#hand-draw)] transition-all duration-100'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 pt-14 pb-20">
        <p className="text-[16px] tracking-[0.15em] uppercase text-[var(--text-muted)] mb-6">
          Arc-native prediction markets
        </p>

        <HeroText />

        <p className="text-[22px] text-[var(--text-secondary)] leading-relaxed mb-10 max-w-[540px]">
          Xen turns any tweet into a range market. Stake USDC on where the metric lands —
          views, likes, reposts, replies. X API resolves the truth.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/feed" className={`${sketchBtnFilled} h-12 px-7 text-[20px]`}>
            Start predicting
          </Link>
          <Link href="/create" className={`${sketchBtn} h-12 px-7 text-[20px]`}>
            Create a market
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="relative max-w-[900px] mx-auto px-5 py-20">
        <span aria-hidden className="absolute top-0 left-5 right-5 h-[2px] sketch-line pointer-events-none" />
        <h2 className="text-[clamp(40px,6vw,72px)] leading-[0.95] mb-14">
          How it works
        </h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex items-start gap-5">
              <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 border-[var(--ink)] [box-shadow:2px_2px_0_var(--ink)] [filter:url(#hand-draw)] text-[20px] text-[var(--ink)] tabular-nums bg-[var(--paper)]">
                {i + 1}
              </span>
              <div>
                <p className="text-[22px] text-[var(--text-primary)] mb-0.5 leading-tight">{step.title}</p>
                <p className="text-[17px] text-[var(--text-muted)] leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-24 text-center">
        <span aria-hidden className="absolute top-0 left-5 right-5 h-[2px] sketch-line pointer-events-none" />
        <div className="max-w-[700px] mx-auto px-5">
          <h2 className="text-[clamp(48px,8vw,96px)] leading-[0.95] mb-8">
            Ready to predict?
          </h2>
          <p className="text-[20px] text-[var(--text-muted)] mb-10 leading-relaxed">
            Connect your wallet and start earning from what you already know about the timeline.
          </p>
          <Link href="/feed" className={`${sketchBtnFilled} h-14 px-10 text-[22px]`}>
            Open the app
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
