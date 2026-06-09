import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const STEPS = [
  { num: '01', title: 'Connect wallet and X', desc: 'Link your Arc wallet and verify your X account. Only tweets posted after connection are eligible.' },
  { num: '02', title: 'Select a fresh tweet', desc: 'Tweets less than 3 hours old qualify as market candidates.' },
  { num: '03', title: 'Generate time-aware ranges', desc: 'GenLayer analyzes tweet velocity, age, and duration to design balanced prediction ranges.' },
  { num: '04', title: 'Create for 0.5 USDC', desc: 'Deploy a USDC-settled pari-mutuel range market on Arc in one transaction.' },
  { num: '05', title: 'Others predict', desc: 'Anyone stakes USDC on a range. The pool distributes to winners at expiry.' },
  { num: '06', title: 'X API resolves the market', desc: 'X API final metric determines the winning range. GenLayer handles fallback disputes.' },
  { num: '07', title: 'Winners claim USDC', desc: 'Winning stakers claim their share of the pool directly on Arc.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#05070B]">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 sm:py-32 px-5 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2563EB]/[0.05] blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto max-w-5xl relative">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3B82F6]/[0.20] bg-[#3B82F6]/[0.06] mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                <span className="text-[12px] font-medium text-[#3B82F6] tracking-wide">Arc · USDC · GenLayer</span>
              </div>

              <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-[#F8FAFC] text-balance mb-6">
                Turn fresh tweets into<br />USDC prediction markets
              </h1>

              <p className="text-[clamp(1rem,2vw,1.125rem)] text-[#94A3B8] leading-relaxed max-w-xl mx-auto mb-10">
                Create short-lived markets on final tweet views, likes, reposts, and replies.
                GenLayer designs time-aware ranges. Arc settles everything in USDC.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/markets"><Button variant="xen" size="xl">Launch App</Button></Link>
                <Link href="/markets"><Button variant="outline" size="xl">View Markets</Button></Link>
              </div>
            </div>

            {/* Market preview card */}
            <div className="max-w-[380px] mx-auto">
              <div className="rounded-[28px] bg-[#0B1220] border border-[rgba(59,130,246,0.18)] p-6 shadow-[0_0_60px_rgba(59,130,246,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[12px] text-[#64748B]">Creator</p>
                    <p className="text-[14px] font-semibold text-[#F8FAFC]">@phantomtee</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[11px] font-medium text-[#22C55E]">Open</div>
                </div>

                <p className="text-[13px] text-[#94A3B8] leading-relaxed mb-4 pb-4 border-b border-white/[0.05]">
                  "Building Xen on Arc. Attention markets should be onchain."
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-[11px] text-[#64748B]">Current views</p>
                    <p className="text-[15px] font-semibold text-[#F8FAFC] tabular-nums">1,240</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B]">USDC pool</p>
                    <p className="text-[15px] font-semibold text-[#F8FAFC] tabular-nums">842</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B]">Ends in</p>
                    <p className="text-[15px] font-semibold text-[#F59E0B]">2h 18m</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: '1.2k – 2k', pct: 22 },
                    { label: '2k – 4k',   pct: 38 },
                    { label: '4k – 7k',   pct: 24 },
                    { label: '7k – 12k',  pct: 11 },
                    { label: '12k+',      pct: 5  },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-[#2563EB]/50" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="text-[12px] text-[#94A3B8] w-16 text-right">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-5 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold text-[#F8FAFC] mb-3">How Xen works</h2>
              <p className="text-[15px] text-[#64748B]">Seven steps from tweet to settled market.</p>
            </div>
            <div className="space-y-2">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-5 p-5 rounded-[20px] bg-[#080D14] border border-white/[0.04] hover:border-white/[0.07] transition-colors">
                  <span className="text-[13px] font-semibold text-[#3B82F6] font-mono shrink-0 mt-0.5">{s.num}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">{s.title}</h3>
                    <p className="text-[13px] text-[#64748B] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature pillars */}
        <section className="py-20 px-5 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { sub: '1 to 48 hours',         title: 'Short-lived markets',    desc: 'Attention windows that expire like the content they track.' },
                { sub: 'AI-designed ranges',     title: 'GenLayer intelligence',  desc: 'Time-aware ranges sized to tweet velocity and market duration.' },
                { sub: 'Stablecoin settlement',  title: 'USDC on Arc',            desc: 'Stake, win, and claim in USDC. No exposure to protocol tokens.' },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-[24px] bg-[#0B1220] border border-white/[0.06]">
                  <p className="text-[11px] font-medium text-[#3B82F6] tracking-wider uppercase mb-3">{f.sub}</p>
                  <h3 className="text-[16px] font-semibold text-[#F8FAFC] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-[#64748B] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-5 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold text-[#F8FAFC] mb-4">Ready to create a market?</h2>
            <p className="text-[15px] text-[#64748B] mb-8">
              Connect your wallet, verify your X account, and turn your next tweet into a prediction market.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/profile"><Button variant="xen" size="xl">Get Started</Button></Link>
              <Link href="/markets"><Button variant="outline" size="xl">Browse Markets</Button></Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
