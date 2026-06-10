'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCount, formatAge, DURATION_OPTIONS, METRIC_OPTIONS, metricLabel } from '@/lib/utils'
import { CONTRACT_ADDRESSES, CREATION_FEE_RAW } from '@/config/contracts'
import { ERC20_ABI, XEN_FACTORY_ABI } from '@/config/abi'
import type { MetricType } from '@/types/market'
import Link from 'next/link'

type Step = 'config' | 'generating' | 'review' | 'approving' | 'creating' | 'done' | 'error'

export default function CreateMarketPage() {
  const params   = useParams()
  const router   = useRouter()
  const tweetId  = params.tweetId as string
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [metric,          setMetric]          = useState<MetricType>('FINAL_VIEWS')
  const [duration,        setDuration]        = useState<number>(3)
  const [step,            setStep]            = useState<Step>('config')
  const [design,          setDesign]          = useState<any>(null)
  const [guardResult,     setGuardResult]     = useState<any>(null)
  const [marketDbId,      setMarketDbId]      = useState<string>('')
  const [onChainConfig,   setOnChainConfig]   = useState<any>(null)
  const [signature,       setSignature]       = useState<string>('')
  const [error,           setError]           = useState<string>('')
  const [createdMarketId, setCreatedMarketId] = useState<string>('')

  const { data: tweetData, isLoading: tweetLoading } = useQuery({
    queryKey: ['tweet', tweetId],
    queryFn:  () => fetch(`/api/tweets/${tweetId}`).then(r => r.json()),
    enabled:  !!tweetId,
  })
  const tweet = tweetData?.tweet

  const { data: allowance } = useReadContract({
    address:      CONTRACT_ADDRESSES.USDC,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address ? [address, CONTRACT_ADDRESSES.XEN_FACTORY] : undefined,
    query:        { enabled: !!address },
  })

  async function handleGenerate() {
    setError('')
    setStep('generating')
    try {
      const res = await fetch('/api/genlayer/design', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tweetId, metricType: metric, durationHours: duration }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Design failed')
      setDesign(data.design)

      const guardRes = await fetch('/api/genlayer/guard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tweetId, metricType: metric, durationHours: duration, design: data.design }),
      })
      const guardData = await guardRes.json()
      if (!guardRes.ok) throw new Error(guardData.error ?? 'Guard failed')

      setGuardResult(guardData.guardResult)
      setMarketDbId(guardData.marketDbId)
      setOnChainConfig(guardData.config)
      setSignature(guardData.signature)
      setStep('review')
    } catch (e) {
      setError((e as Error).message)
      setStep('error')
    }
  }

  async function handleCreate() {
    if (!onChainConfig || !design || !address) return
    setError('')
    try {
      if ((allowance ?? 0n) < CREATION_FEE_RAW) {
        setStep('approving')
        await writeContractAsync({
          address:      CONTRACT_ADDRESSES.USDC,
          abi:          ERC20_ABI,
          functionName: 'approve',
          args:         [CONTRACT_ADDRESSES.XEN_FACTORY, CREATION_FEE_RAW],
        })
      }
      setStep('creating')
      const configTuple = {
        creator:            onChainConfig.creator,
        xUserIdHash:        onChainConfig.xUserIdHash,
        tweetId:            onChainConfig.tweetId,
        metricType:         onChainConfig.metricType,
        startValue:         BigInt(onChainConfig.startValue),
        createdAt:          BigInt(onChainConfig.createdAt),
        marketStartTime:    BigInt(onChainConfig.marketStartTime),
        marketEndTime:      BigInt(onChainConfig.marketEndTime),
        rangesHash:         onChainConfig.rangesHash,
        marketQuestionHash: onChainConfig.marketQuestionHash,
        genLayerReportHash: onChainConfig.genLayerReportHash,
        nonce:              BigInt(onChainConfig.nonce),
      }
      const ranges = design.ranges.map((r: any) => ({
        min:        BigInt(r.min),
        max:        r.max != null ? BigInt(r.max) : 0n,
        maxOpen:    r.maxOpen,
        label:      r.label,
        difficulty: r.difficulty,
      }))
      const txHash = await writeContractAsync({
        address:      CONTRACT_ADDRESSES.XEN_FACTORY,
        abi:          XEN_FACTORY_ABI,
        functionName: 'createMarket',
        args:         [configTuple, ranges, signature as `0x${string}`],
      })
      await fetch('/api/markets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ marketDbId, chainMarketId: '0', contractAddress: '0x0', txHash }),
      })
      setCreatedMarketId(marketDbId)
      setStep('done')
    } catch (e) {
      setError((e as Error).message.slice(0, 300))
      setStep('error')
    }
  }

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-2xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-[16px]">
          <Link href="/profile" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            Profile
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)]">Create Market</span>
        </div>

        <div>
          <h1 className="text-[34px] text-[var(--text-primary)] leading-tight mb-1">Create Market</h1>
          <p className="text-[18px] text-[var(--text-muted)]">GenLayer designs fair, time-aware ranges for your tweet</p>
        </div>

        {/* Tweet preview */}
        {tweetLoading ? (
          <div className="h-36 sketch-card animate-pulse" />
        ) : tweet ? (
          <div className={`sketch-card p-5 ${!tweet.eligible ? 'opacity-60' : ''}`}>
            <p className="text-[17px] leading-relaxed text-[var(--text-primary)] mb-4">{tweet.text}</p>
            <div className="grid grid-cols-4 gap-3 py-3 border-y-2 border-[var(--border-soft)] mb-3">
              {[
                { label: 'Views',   value: tweet.normalizedMetrics?.views != null ? formatCount(tweet.normalizedMetrics.views) : 'N/A' },
                { label: 'Likes',   value: formatCount(tweet.normalizedMetrics?.likes ?? 0) },
                { label: 'Reposts', value: formatCount(tweet.normalizedMetrics?.reposts ?? 0) },
                { label: 'Replies', value: formatCount(tweet.normalizedMetrics?.replies ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[17px] text-[var(--text-primary)] tabular-nums">{value}</p>
                  <p className="text-[14px] text-[var(--text-muted)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-[var(--text-muted)]">Posted {formatAge(tweet.created_at)} ago</span>
              {tweet.eligible ? (
                <span className="text-[var(--text-primary)]">Eligible</span>
              ) : (
                <span className="text-[var(--xen-red)]">{tweet.eligibilityNote}</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Step 1: Configuration */}
        {(step === 'config' || step === 'error') && tweet?.eligible && (
          <div className="sketch-card p-6 space-y-5">
            <h2 className="text-[22px] text-[var(--text-primary)]">Market configuration</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[16px] text-[var(--text-muted)]">Metric</Label>
                <Select value={metric} onValueChange={v => setMetric(v as MetricType)}>
                  <SelectTrigger className="bg-[var(--bg-card)] border-[var(--ink)] text-[var(--text-primary)] rounded-[4px] text-[16px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--ink)] rounded-[4px]">
                    {METRIC_OPTIONS.filter(o => o.available).map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-[var(--text-primary)] text-[16px]">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[16px] text-[var(--text-muted)]">Duration</Label>
                <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                  <SelectTrigger className="bg-[var(--bg-card)] border-[var(--ink)] text-[var(--text-primary)] rounded-[4px] text-[16px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--ink)] rounded-[4px]">
                    {DURATION_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)} className="text-[var(--text-primary)] text-[16px]">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {step === 'error' && error && (
              <p className="text-[16px] text-[var(--xen-red)] border-2 border-[var(--xen-red)] rounded-[4px] p-4">{error}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t-2 border-[var(--border-soft)]">
              <div>
                <p className="text-[15px] text-[var(--text-muted)]">Creation fee</p>
                <p className="text-[20px] text-[var(--text-primary)]">0.5 USDC</p>
              </div>
              <Button variant="filled" onClick={handleGenerate} disabled={!address}>
                Generate Ranges with GenLayer
              </Button>
            </div>
            {!address && (
              <p className="text-[16px] text-[var(--text-muted)]">Connect your wallet to create markets</p>
            )}
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="sketch-card p-10 text-center space-y-3">
            <div className="w-full h-[3px] bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[var(--ink)] animate-[shimmer_1.6s_infinite] w-1/2" />
            </div>
            <p className="text-[20px] text-[var(--text-primary)]">GenLayer is designing time-aware ranges</p>
            <p className="text-[17px] text-[var(--text-muted)]">Analysing tweet velocity, age, and selected duration.</p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && design && (
          <div className="space-y-4">
            <div className="sketch-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] text-[var(--text-primary)]">GenLayer market design</h2>
                <Badge variant={guardResult?.approved ? 'green' : 'red'}>
                  {guardResult?.approved ? 'Approved' : 'Rejected'}
                </Badge>
              </div>

              {design.reason && (
                <p className="text-[16px] text-[var(--text-muted)] leading-relaxed sketch-panel p-4">
                  {design.reason}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Metric',   value: metricLabel(metric) },
                  { label: 'Duration', value: `${design.durationHours}h` },
                  { label: 'Start',    value: formatCount(design.startValue) },
                ].map(({ label, value }) => (
                  <div key={label} className="sketch-panel p-3 text-center">
                    <p className="text-[18px] text-[var(--text-primary)] tabular-nums">{value}</p>
                    <p className="text-[14px] text-[var(--text-muted)] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[14px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Generated ranges</p>
                {design.ranges.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[4px] border-2 border-[var(--border-soft)]">
                    <span className="text-[18px] text-[var(--text-primary)]">{r.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-[3px] rounded-full bg-[var(--border-soft)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${r.difficulty * 10}%` }} />
                      </div>
                      <span className="text-[14px] text-[var(--text-muted)] w-20 text-right">
                        {r.difficulty}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-[var(--border-soft)]">
                <div>
                  <p className="text-[15px] text-[var(--text-muted)] mb-1">Market quality</p>
                  <p className="text-[18px] text-[var(--text-primary)]">{design.qualityScore >= 7 ? 'High' : design.qualityScore >= 4 ? 'Medium' : 'Low'}</p>
                </div>
                <div>
                  <p className="text-[15px] text-[var(--text-muted)] mb-1">Manipulation risk</p>
                  <p className="text-[18px] text-[var(--text-primary)]">{design.riskScore <= 3 ? 'Low' : design.riskScore <= 6 ? 'Medium' : 'High'}</p>
                </div>
              </div>

              <div className="sketch-panel p-4 text-[16px] text-[var(--text-muted)]">
                <span className="text-[var(--text-primary)]">Question: </span>
                "What will this tweet's final total {metricLabel(metric).toLowerCase()} be after {duration} hour{duration !== 1 ? 's' : ''}?"
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] text-[var(--text-muted)]">Creation fee</p>
                <p className="text-[20px] text-[var(--text-primary)]">0.5 USDC</p>
              </div>
              <div className="flex gap-3">
                <Button variant="xen" onClick={() => setStep('config')}>Back</Button>
                <Button variant="filled" onClick={handleCreate}>
                  {(allowance ?? 0n) < CREATION_FEE_RAW ? 'Approve and Create Market' : 'Create Market'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Approving / creating */}
        {(step === 'approving' || step === 'creating') && (
          <div className="sketch-card p-10 text-center space-y-3">
            <div className="w-full h-[3px] bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[var(--ink)] animate-[shimmer_1.6s_infinite] w-1/2" />
            </div>
            <p className="text-[20px] text-[var(--text-primary)]">
              {step === 'approving' ? 'Approving USDC…' : 'Creating market on Arc…'}
            </p>
            <p className="text-[17px] text-[var(--text-muted)]">Confirm the transaction in your wallet.</p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="sketch-card p-10 text-center space-y-4">
            <div className="text-[40px] text-[var(--text-primary)] mb-2">Market created</div>
            <p className="text-[18px] text-[var(--text-muted)]">
              Your {metricLabel(metric)} prediction market is live for {duration} hour{duration !== 1 ? 's' : ''}.
              Traders can now stake USDC on ranges.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href={`/market/${createdMarketId}`}>
                <Button variant="filled">View Market</Button>
              </Link>
              <Link href="/profile">
                <Button variant="xen">Back to Profile</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
