'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MetricType } from '@/types/market'

type Step = 1 | 2 | 3 | 4 | 5

interface Tweet {
  id:               string
  tweetId:          string
  text:             string
  normalizedMetrics: { views: number; likes: number; reposts: number; replies: number }
  eligible:         boolean
  eligibilityNote?: string
  createdAtOnX:     string
}

const METRICS: { key: MetricType; label: string; metricKey: keyof Tweet['normalizedMetrics'] }[] = [
  { key: 'FINAL_VIEWS',   label: 'Final Views',   metricKey: 'views'   },
  { key: 'FINAL_LIKES',   label: 'Final Likes',   metricKey: 'likes'   },
  { key: 'FINAL_REPOSTS', label: 'Final Reposts', metricKey: 'reposts' },
  { key: 'FINAL_REPLIES', label: 'Final Replies', metricKey: 'replies' },
]

const DURATIONS = [1, 3, 6, 12, 24, 48]

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function CreatePage() {
  const { address, isConnected } = useAccount()

  const [step,             setStep]             = useState<Step>(1)
  const [selectedTweet,    setSelectedTweet]    = useState<Tweet | null>(null)
  const [selectedMetric,   setSelectedMetric]   = useState<MetricType | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [generating,       setGenerating]       = useState(false)
  const [genResult,        setGenResult]        = useState<any>(null)
  const [genError,         setGenError]         = useState<string | null>(null)
  const [creating,         setCreating]         = useState(false)
  const [createError,      setCreateError]      = useState<string | null>(null)
  const [createdMarketId,  setCreatedMarketId]  = useState<string | null>(null)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
    staleTime: 60_000,
  })
  const me = meData?.user

  const { data: tweetsData, isLoading: tweetsLoading } = useQuery<{ tweets: Tweet[] }>({
    queryKey: ['tweets'],
    queryFn:  () => fetch('/api/tweets').then(r => r.json()),
    enabled:  !!me?.xUsername && isConnected,
    staleTime: 120_000,
  })

  async function handleGenerate() {
    if (!selectedTweet || !selectedMetric || !selectedDuration) return
    setGenerating(true)
    setGenError(null)
    try {
      const metricDef  = METRICS.find(m => m.key === selectedMetric)!
      const startValue = selectedTweet.normalizedMetrics[metricDef.metricKey]
      const res = await fetch('/api/genlayer/design', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tweetId:      selectedTweet.tweetId,
          metricType:   selectedMetric,
          durationHours: selectedDuration,
          startValue,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'GenLayer design failed')
      setGenResult(data.design)
      setStep(5)
    } catch (e) {
      setGenError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCreate() {
    if (!selectedTweet || !selectedMetric || !selectedDuration || !address) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/markets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tweetId:       selectedTweet.tweetId,
          metricType:    selectedMetric,
          durationHours: selectedDuration,
          walletAddress: address,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create market')
      setCreatedMarketId(data.marketId ?? data.market?.id)
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  // Step indicator dots
  const StepDots = () => (
    <div className="flex items-center gap-1.5 mb-6">
      {([1, 2, 3, 4, 5] as Step[]).map(s => (
        <span
          key={s}
          className={cn(
            'rounded-full transition-all duration-200',
            step >= s
              ? 'w-4 h-1.5 bg-[var(--accent-primary)]'
              : 'w-1.5 h-1.5 bg-[var(--border-soft)] border border-[var(--border-soft)]'
          )}
        />
      ))}
    </div>
  )

  if (createdMarketId) {
    return (
      <AppShell>
        <div className="max-w-[520px] mx-auto px-4 pt-12 pb-10 text-center">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Market created</p>
          <h2 className="text-[24px] font-semibold text-[var(--text-primary)] mb-4">Position active</h2>
          <p className="text-[14px] text-[var(--text-muted)] mb-6">
            Your market is live on Xen. Share it so others can predict.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href={`/market/${createdMarketId}`}>
              <Button variant="xen" size="lg">View Market</Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg">Back to Feed</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  // Desktop: two-panel layout; mobile: single column
  return (
    <AppShell>
      <div className="max-w-[900px] mx-auto px-4 md:px-6 pt-5 pb-12">
        <div className="md:grid md:grid-cols-[1fr_1fr] md:gap-8">

          {/* Left: tweet preview (desktop) */}
          <div className="hidden md:block">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Preview</p>
            {selectedTweet ? (
              <div className="bg-[var(--bg-elevated)] rounded-[20px] border border-[var(--border-soft)] p-5">
                <p className="text-[11px] text-[var(--text-muted)] mb-2">@{me?.xUsername}</p>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                  &ldquo;{selectedTweet.text}&rdquo;
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {METRICS.map(m => (
                    <div key={m.key} className={cn(
                      'px-2.5 py-2 rounded-[10px] bg-[var(--bg-muted)]',
                      selectedMetric === m.key && 'border border-[var(--border-active)]'
                    )}>
                      <p className="text-[var(--text-muted)]">{m.label.replace('Final ', '')}</p>
                      <p className="text-[var(--text-primary)] font-semibold tabular-nums">
                        {formatMetric(selectedTweet.normalizedMetrics[m.metricKey])}
                      </p>
                    </div>
                  ))}
                </div>
                {selectedMetric && selectedDuration && (
                  <div className="mt-4 p-3 bg-[var(--accent-primary)]/[0.06] rounded-[12px] border border-[var(--border-active)]">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">
                      What will this tweet&apos;s {selectedMetric.replace('FINAL_', '').toLowerCase()} be in {selectedDuration}h?
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--bg-elevated)] rounded-[20px] border border-[var(--border-soft)] p-8 flex items-center justify-center h-[260px]">
                <p className="text-[13px] text-[var(--text-muted)]">Select a tweet to preview</p>
              </div>
            )}
          </div>

          {/* Right: step machine */}
          <div>
            <StepDots />

            {/* STEP 1 — Select tweet */}
            <div className="mb-6">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Step 1 — Select Tweet
              </p>

              {!isConnected && (
                <div className="bg-[var(--accent-primary)]/[0.06] border border-[var(--border-active)] rounded-[14px] p-4 mb-3">
                  <p className="text-[13px] text-[var(--text-secondary)]">Connect your wallet to get started.</p>
                </div>
              )}

              {isConnected && !me?.xUsername && (
                <div className="bg-[var(--accent-primary)]/[0.06] border border-[var(--border-active)] rounded-[14px] p-4 mb-3">
                  <p className="text-[13px] text-[var(--text-secondary)] mb-2">
                    Connect your X account to see your tweets.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm">Go to Settings</Button>
                  </Link>
                </div>
              )}

              {tweetsLoading && (
                <div className="grid grid-cols-1 gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-[80px] rounded-[16px] bg-[var(--bg-elevated)] animate-pulse border border-[var(--border-soft)]" />
                  ))}
                </div>
              )}

              {tweetsData?.tweets && (
                <div className="space-y-2 max-h-[320px] overflow-y-auto hide-scrollbar">
                  {tweetsData.tweets.map(tweet => (
                    <button
                      key={tweet.id}
                      onClick={() => { setSelectedTweet(tweet); setStep(2) }}
                      className={cn(
                        'w-full text-left p-3.5 rounded-[16px] border transition-all',
                        selectedTweet?.id === tweet.id
                          ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/[0.06]'
                          : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] hover:border-[rgba(16,185,129,0.3)]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2 flex-1">{tweet.text}</p>
                        <Badge variant={tweet.eligible ? 'open' : 'neutral'} className="shrink-0 text-[9px]">
                          {tweet.eligible ? 'Eligible' : 'Ineligible'}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-[10px] text-[var(--text-muted)] tabular-nums">
                        <span>{formatMetric(tweet.normalizedMetrics.views)} views</span>
                        <span>{formatMetric(tweet.normalizedMetrics.likes)} likes</span>
                        <span>{formatMetric(tweet.normalizedMetrics.reposts)} reposts</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 2 — Select metric */}
            {step >= 2 && (
              <div className="mb-6">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Step 2 — Select Metric
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {METRICS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => { setSelectedMetric(m.key); setStep(3) }}
                      className={cn(
                        'p-3.5 rounded-[14px] border text-left transition-all',
                        selectedMetric === m.key
                          ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/[0.06]'
                          : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] hover:border-[rgba(16,185,129,0.3)]'
                      )}
                    >
                      <p className="text-[13px] font-medium text-[var(--text-primary)] mb-0.5">{m.label}</p>
                      {selectedTweet && (
                        <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                          {formatMetric(selectedTweet.normalizedMetrics[m.metricKey])} now
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 — Select duration */}
            {step >= 3 && (
              <div className="mb-6">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Step 3 — Duration
                </p>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDuration(d); setStep(4) }}
                      className={cn(
                        'px-4 py-2 rounded-[10px] text-[13px] font-medium border transition-all',
                        selectedDuration === d
                          ? 'border-[var(--border-active)] bg-[var(--accent-primary)] text-white'
                          : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[rgba(16,185,129,0.3)]'
                      )}
                    >
                      {d}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 — Generate ranges */}
            {step >= 4 && !genResult && (
              <div className="mb-6">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Step 4 — Generate Ranges
                </p>
                {generating ? (
                  <div className="text-center py-6">
                    <div className="h-1.5 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden mb-3">
                      <div className="h-full w-1/2 bg-[var(--accent-primary)] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full" />
                    </div>
                    <p className="text-[13px] text-[var(--text-muted)]">
                      GenLayer is designing time-aware ranges…
                    </p>
                  </div>
                ) : (
                  <div>
                    <Button variant="xen" size="lg" className="w-full" onClick={handleGenerate}>
                      Generate Ranges with GenLayer
                    </Button>
                    {genError && (
                      <p className="text-[12px] text-[var(--xen-red)] mt-2">{genError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5 — Review & create */}
            {step >= 5 && genResult && (
              <div className="mb-6">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Step 5 — Review & Create
                </p>

                <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-4">
                  <p className="text-[14px] font-medium text-[var(--text-primary)] mb-3">
                    What will this tweet&apos;s {selectedMetric?.replace('FINAL_', '').toLowerCase()} be in {selectedDuration}h?
                  </p>

                  <div className="space-y-1.5 mb-4">
                    {(genResult.ranges ?? []).map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-[var(--bg-muted)]">
                        <span className="text-[12px] text-[var(--text-secondary)]">{r.label}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">difficulty {r.difficulty}/10</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 text-[11px] mb-2">
                    <span className="text-[var(--text-muted)]">
                      Quality <span className="text-[var(--accent-primary)] font-medium">{genResult.qualityScore}/100</span>
                    </span>
                    <span className="text-[var(--text-muted)]">
                      Risk <span className="text-[var(--xen-amber)] font-medium">{genResult.riskScore}/10</span>
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {genResult.approved
                        ? <span className="text-[var(--accent-primary)]">Approved</span>
                        : <span className="text-[var(--xen-red)]">Rejected</span>}
                    </span>
                  </div>

                  {genResult.reason && (
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{genResult.reason}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)] mb-4 px-1">
                  <span>Creation fee</span>
                  <span className="text-[var(--text-primary)] font-medium">0.5 USDC</span>
                </div>

                {createError && (
                  <p className="text-[12px] text-[var(--xen-red)] mb-3">{createError}</p>
                )}

                <Button
                  variant="xen"
                  size="lg"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={creating || !genResult.approved}
                >
                  {creating ? 'Creating…' : 'Create Market'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
