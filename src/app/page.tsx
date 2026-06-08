import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  Zap, TrendingUp, Shield, Clock, ArrowRight,
  Twitter, Wallet, BarChart3, CheckCircle
} from 'lucide-react'

const STEPS = [
  {
    icon: Twitter,
    title:  'Connect X',
    desc:   'Link your X account. Only tweets posted after connection are eligible.',
    color:  'text-blue-400',
    bg:     'bg-blue-900/20',
  },
  {
    icon:  TrendingUp,
    title: 'Pick a fresh tweet',
    desc:  'Tweets less than 3 hours old become market candidates.',
    color: 'text-violet-400',
    bg:    'bg-violet-900/20',
  },
  {
    icon:  BarChart3,
    title: 'GenLayer designs ranges',
    desc:  'Fair, time-aware range prediction markets tailored to tweet velocity and duration.',
    color: 'text-emerald-400',
    bg:    'bg-emerald-900/20',
  },
  {
    icon:  Zap,
    title: 'Create for 0.5 USDC',
    desc:  'Deploy a USDC-settled pari-mutuel range market on Arc in one transaction.',
    color: 'text-amber-400',
    bg:    'bg-amber-900/20',
  },
  {
    icon:  CheckCircle,
    title: 'Traders predict',
    desc:  'Anyone stakes USDC into a range. Pool distributes to winners at expiry.',
    color: 'text-pink-400',
    bg:    'bg-pink-900/20',
  },
]

const FEATURES = [
  { icon: Clock,   title: '1–48 hour markets', desc: 'Short-lived attention windows.' },
  { icon: Shield,  title: 'GenLayer verified', desc:  'AI-designed ranges, dispute resolution.' },
  { icon: Wallet,  title: 'USDC-native',        desc:  'Stake, win, and claim in USDC on Arc.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto max-w-4xl text-center space-y-6 relative">
            <Badge variant="purple" className="text-xs px-3 py-1">
              Arc-native · USDC-settled · GenLayer-verified
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-violet-300 bg-clip-text text-transparent">
              Turn fresh tweets into<br />USDC attention markets
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Xen lets verified X creators build short-lived range prediction markets on their own
              tweets. GenLayer designs fair ranges. Arc settles everything in USDC.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button variant="xen" size="xl" className="gap-2">
                  Explore Live Markets <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="xl" className="gap-2">
                  Create a Market
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {STEPS.map((s, i) => (
                <Card key={i} className="gradient-border">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground">Step {i + 1}</div>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Example */}
        <section className="py-16 px-4 bg-accent/20">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-center mb-8">Range market example</h2>
            <Card className="gradient-border">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tweet at <strong>1,200 views</strong> · <strong>3-hour</strong> market ·
                  Question: <em>"What will this tweet's final total views be?"</em>
                </p>
                <div className="space-y-2">
                  {[
                    { label: '1.2k – 2k',  diff: 2,  color: 'bg-emerald-500' },
                    { label: '2k – 4k',    diff: 4,  color: 'bg-blue-500'    },
                    { label: '4k – 7k',    diff: 6,  color: 'bg-violet-500'  },
                    { label: '7k – 12k',   diff: 8,  color: 'bg-amber-500'   },
                    { label: '12k+',       diff: 10, color: 'bg-red-500'     },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${100 - r.diff * 8}%` }} />
                      <span className="text-sm font-mono shrink-0">{r.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Final views = <strong>6,800</strong> → winning range <strong>4k–7k</strong>.
                  Winners split the losing pool pro-rata minus 1% fee.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-xl text-center">
            <p className="text-xs text-muted-foreground">
              Xen uses X API metrics. Markets may void if data cannot be verified at settlement.
              Not financial advice. Participation subject to your jurisdiction's laws.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
