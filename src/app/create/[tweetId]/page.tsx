'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Eye, Heart, Repeat2, MessageCircle, Clock, Zap,
  AlertCircle, CheckCircle2, ArrowLeft, Loader2
} from 'lucide-react'
import { formatCount, formatAge, DURATION_OPTIONS, METRIC_OPTIONS, metricLabel, formatUSDC } from '@/lib/utils'
import { CONTRACT_ADDRESSES, CREATION_FEE_RAW } from '@/config/contracts'
import { ERC20_ABI, XEN_FACTORY_ABI } from '@/config/abi'
import type { MetricType } from '@/types/market'
import Link from 'next/link'

type Step = 'config' | 'generating' | 'review' | 'approving' | 'creating' | 'done' | 'error'

export default function CreateMarketPage() {
  const params  = useParams()
  const router  = useRouter()
  const tweetId = params.tweetId as string
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [metric,   setMetric]   = useState<MetricType>('FINAL_VIEWS')
  const [duration, setDuration] = useState<number>(3)
  const [step,     setStep]     = useState<Step>('config')
  const [design,   setDesign]   = useState<any>(null)
  const [guardResult, setGuardResult] = useState<any>(null)
  const [marketDbId,  setMarketDbId]  = useState<string>('')
  const [onChainConfig, setOnChainConfig] = useState<any>(null)
  const [signature,     setSignature]     = useState<string>('')
  const [error,         setError]         = useState<string>('')
  const [createdMarketId, setCreatedMarketId] = useState<string>('')

  // Fetch tweet info
  const { data: tweetData, isLoading: tweetLoading } = useQuery({
    queryKey: ['tweet', tweetId],
    queryFn:  () => fetch(`/api/tweets/${tweetId}`).then(r => r.json()),
    enabled:  !!tweetId,
  })

  const tweet = tweetData?.tweet

  // Read USDC allowance
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

      // Also run guard
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
      // Approve USDC if needed
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

      // Record in DB
      // (We parse chainMarketId from tx receipt in a real integration; use 0 as placeholder)
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Create Market</h1>
            <p className="text-sm text-muted-foreground">GenLayer designs fair ranges for your tweet</p>
          </div>
        </div>

        {/* Tweet preview */}
        {tweetLoading ? (
          <div className="h-32 rounded-xl bg-card animate-pulse" />
        ) : tweet ? (
          <Card className="gradient-border">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm leading-relaxed">{tweet.text}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {tweet.normalizedMetrics?.views != null ? (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {formatCount(tweet.normalizedMetrics.views)} views
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Eye className="h-3.5 w-3.5" /> views unavailable
                  </span>
                )}
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {formatCount(tweet.normalizedMetrics?.likes ?? 0)}</span>
                <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /> {formatCount(tweet.normalizedMetrics?.reposts ?? 0)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {formatCount(tweet.normalizedMetrics?.replies ?? 0)}</span>
                <span className="flex items-center gap-1 ml-auto"><Clock className="h-3.5 w-3.5" /> {formatAge(tweet.created_at)}</span>
              </div>
              {!tweet.eligible && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" /> {tweet.eligibilityNote}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Config */}
        {(step === 'config' || step === 'error') && tweet?.eligible && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Market configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select value={metric} onValueChange={v => setMetric(v as MetricType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.filter(o => o.available).map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {step === 'error' && error && (
                <div className="flex items-start gap-2 text-red-400 text-sm p-3 bg-red-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">Creation fee: <strong>0.5 USDC</strong></p>
                <Button variant="xen" onClick={handleGenerate} disabled={!address} className="gap-2">
                  <Zap className="h-4 w-4" /> Generate with GenLayer
                </Button>
              </div>
              {!address && <p className="text-xs text-muted-foreground">Connect wallet to create markets</p>}
            </CardContent>
          </Card>
        )}

        {/* Generating */}
        {step === 'generating' && (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="font-medium">GenLayer designing ranges…</p>
              <p className="text-sm text-muted-foreground">Analysing tweet velocity, age, and selected duration.</p>
            </CardContent>
          </Card>
        )}

        {/* Review + create */}
        {step === 'review' && design && (
          <div className="space-y-4">
            <Card className="gradient-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">GenLayer market design</CardTitle>
                  <Badge variant={guardResult?.approved ? 'green' : 'red'}>
                    {guardResult?.approved ? 'Approved' : 'Rejected'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{design.reason}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2 rounded bg-accent/30 text-center">
                    <div className="font-medium">{metricLabel(metric)}</div>
                    <div className="text-muted-foreground">metric</div>
                  </div>
                  <div className="p-2 rounded bg-accent/30 text-center">
                    <div className="font-medium">{design.durationHours}h</div>
                    <div className="text-muted-foreground">duration</div>
                  </div>
                  <div className="p-2 rounded bg-accent/30 text-center">
                    <div className="font-medium">{formatCount(design.startValue)}</div>
                    <div className="text-muted-foreground">start value</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Ranges</Label>
                  {design.ranges.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border border-border text-sm">
                      <span className="font-mono">{r.label}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={r.difficulty * 10} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground">diff {r.difficulty}/10</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground bg-accent/20 rounded p-2">
                  Question: &quot;What will this tweet&apos;s final total {metricLabel(metric).toLowerCase()} be after {duration} hour(s)?&quot;
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Cost: <strong>0.5 USDC</strong> creation fee
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('config')}>Back</Button>
                <Button variant="xen" onClick={handleCreate} className="gap-2">
                  {(allowance ?? 0n) < CREATION_FEE_RAW ? 'Approve & Create Market' : 'Create Market'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Approving / creating */}
        {(step === 'approving' || step === 'creating') && (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="font-medium">
                {step === 'approving' ? 'Approving USDC…' : 'Creating market on Arc…'}
              </p>
              <p className="text-sm text-muted-foreground">Confirm the transaction in your wallet.</p>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {step === 'done' && (
          <Card className="gradient-border glow-green">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400" />
              <h2 className="text-xl font-bold">Market created!</h2>
              <p className="text-sm text-muted-foreground">
                Your {metricLabel(metric)} prediction market is live for {duration} hour(s).
                Traders can now stake USDC on ranges.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/market/${createdMarketId}`}>
                  <Button variant="xen">View Market</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline">Back to Profile</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
