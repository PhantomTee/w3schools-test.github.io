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

        {/* Back */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-[13px] text-[#64748B] hover:text-[var(--text-muted)] transition-colors">
            Profile
          </Link>
          <span className="text-[#64748B]">/</span>
          <span className="text-[13px] text-[var(--text-muted)]">Create Market</span>
        </div>

        <div>
          <h1 className="text-[24px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Create Market</h1>
          <p className="text-[14px] text-[#64748B]">GenLayer designs fair, time-aware ranges for your tweet</p>
        </div>

        {/* Tweet preview */}
        {tweetLoading ? (
          <div className="h-36 rounded-[24px] shimmer" />
        ) : tweet ? (
          <div className={`rounded-[24px] border p-5 ${tweet.eligible ? 'bg-[#0B1220] border-[rgba(59,130,246,0.18)]' : 'bg-[#080D14] border-white/[0.04]'}`}>
            <p className="text-[14px] leading-relaxed text-[#F8FAFC] mb-4">{tweet.text}</p>
            <div className="grid grid-cols-4 gap-3 py-3 border-y border-white/[0.05] mb-3">
              {[
                { label: 'Views',   value: tweet.normalizedMetrics?.views != null ? formatCount(tweet.normalizedMetrics.views) : 'N/A' },
                { label: 'Likes',   value: formatCount(tweet.normalizedMetrics?.likes ?? 0) },
                { label: 'Reposts', value: formatCount(tweet.normalizedMetrics?.reposts ?? 0) },
                { label: 'Replies', value: formatCount(tweet.normalizedMetrics?.replies ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">{value}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#64748B]">Posted {formatAge(tweet.created_at)} ago</span>
              {tweet.eligible ? (
                <span className="text-[var(--ink)]">Eligible</span>
              ) : (
                <span className="text-[#EF4444]">{tweet.eligibilityNote}</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Step 1: Configuration */}
        {(step === 'config' || step === 'error') && tweet?.eligible && (
          <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6 space-y-5">
            <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Market configuration</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[12px] text-[#64748B]">Metric</Label>
                <Select value={metric} onValueChange={v => setMetric(v as MetricType)}>
                  <SelectTrigger className="bg-[#080D14] border-white/[0.08] text-[#F8FAFC] rounded-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1220] border-white/[0.08] rounded-[16px]">
                    {METRIC_OPTIONS.filter(o => o.available).map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-[#F8FAFC] focus:bg-white/[0.06]">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] text-[#64748B]">Duration</Label>
                <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                  <SelectTrigger className="bg-[#080D14] border-white/[0.08] text-[#F8FAFC] rounded-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1220] border-white/[0.08] rounded-[16px]">
                    {DURATION_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)} className="text-[#F8FAFC] focus:bg-white/[0.06]">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {step === 'error' && error && (
              <p className="text-[13px] text-[#EF4444] bg-[#EF4444]/[0.08] rounded-[12px] p-4">{error}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <div>
                <p className="text-[13px] text-[#64748B]">Creation fee</p>
                <p className="text-[15px] font-semibold text-[#F8FAFC]">0.5 USDC</p>
              </div>
              <Button variant="xen" onClick={handleGenerate} disabled={!address}>
                Generate Ranges with GenLayer
              </Button>
            </div>
            {!address && (
              <p className="text-[12px] text-[#64748B]">Connect your wallet to create markets</p>
            )}
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-10 text-center space-y-3">
            <div className="w-full h-[2px] bg-[#101827] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-transparent via-[var(--ink)] to-transparent animate-[shimmer_1.6s_infinite] w-1/2" />
            </div>
            <p className="text-[16px] font-semibold text-[#F8FAFC]">GenLayer is designing time-aware ranges</p>
            <p className="text-[13px] text-[#64748B]">Analysing tweet velocity, age, and selected duration.</p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && design && (
          <div className="space-y-4">
            <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#F8FAFC]">GenLayer market design</h2>
                <Badge variant={guardResult?.approved ? 'green' : 'red'}>
                  {guardResult?.approved ? 'Approved' : 'Rejected'}
                </Badge>
              </div>

              {design.reason && (
                <p className="text-[13px] text-[#64748B] leading-relaxed bg-[#080D14] rounded-[12px] p-4">
                  {design.reason}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Metric',   value: metricLabel(metric) },
                  { label: 'Duration', value: `${design.durationHours}h` },
                  { label: 'Start',    value: formatCount(design.startValue) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-[12px] bg-[#080D14] text-center">
                    <p className="text-[13px] font-semibold text-[#F8FAFC]">{value}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[12px] text-[#64748B] uppercase tracking-wider mb-3">Generated ranges</p>
                {design.ranges.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[12px] border border-white/[0.05] bg-[#080D14]">
                    <span className="text-[14px] font-medium text-[#F8FAFC]">{r.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${r.difficulty * 10}%` }} />
                      </div>
                      <span className="text-[12px] text-[#64748B] w-16 text-right">
                        Difficulty {r.difficulty}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.05] text-[13px]">
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Market quality</p>
                  <p className="text-[#F8FAFC] font-medium">{design.qualityScore >= 7 ? 'High' : design.qualityScore >= 4 ? 'Medium' : 'Low'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Manipulation risk</p>
                  <p className="text-[#F8FAFC] font-medium">{design.riskScore <= 3 ? 'Low' : design.riskScore <= 6 ? 'Medium' : 'High'}</p>
                </div>
              </div>

              <div className="rounded-[12px] bg-[#080D14] p-4 text-[13px] text-[#64748B]">
                <span className="text-[var(--text-muted)]">Question: </span>
                "What will this tweet's final total {metricLabel(metric).toLowerCase()} be after {duration} hour{duration !== 1 ? 's' : ''}?"
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[#64748B]">Creation fee</p>
                <p className="text-[15px] font-semibold text-[#F8FAFC]">0.5 USDC</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('config')}>Back</Button>
                <Button variant="xen" onClick={handleCreate}>
                  {(allowance ?? 0n) < CREATION_FEE_RAW ? 'Approve and Create Market' : 'Create Market'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Approving / creating */}
        {(step === 'approving' || step === 'creating') && (
          <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-10 text-center space-y-3">
            <div className="w-full h-[2px] bg-[#101827] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-transparent via-[var(--ink)] to-transparent animate-[shimmer_1.6s_infinite] w-1/2" />
            </div>
            <p className="text-[16px] font-semibold text-[#F8FAFC]">
              {step === 'approving' ? 'Approving USDC...' : 'Creating market on Arc...'}
            </p>
            <p className="text-[13px] text-[#64748B]">Confirm the transaction in your wallet.</p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="rounded-[24px] bg-[#0B1220] border border-[rgba(34,197,94,0.25)] p-10 text-center space-y-4">
            <div className="text-[40px] font-semibold text-[var(--ink)] mb-2">Market created</div>
            <p className="text-[14px] text-[#64748B]">
              Your {metricLabel(metric)} prediction market is live for {duration} hour{duration !== 1 ? 's' : ''}.
              Traders can now stake USDC on ranges.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href={`/market/${createdMarketId}`}>
                <Button variant="xen">View Market</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Back to Profile</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
