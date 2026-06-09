/**
 * GenLayer integration module.
 *
 * GenLayer acts as:
 *   1. Market Designer  – generates fair, time-aware ranges
 *   2. Market Guard     – validates market safety and eligibility
 *   3. Dispute Resolver – resolves ambiguous/disputed outcomes
 *
 * Routing:
 *   GENLAYER_NODE_URL set  → GenLayer node JSON-RPC
 *   OPENAI_API_KEY set     → Direct OpenAI (dev/fallback)
 *   GENLAYER_MOCK_MODE=true → Deterministic mock (tests only)
 *
 * All outputs are strict JSON. Validation rejects and returns errors on
 * malformed output — never silently accepts.
 */
import type {
  Range,
  MetricType,
  GenLayerDesignResponse,
  GenLayerGuardResponse,
  GenLayerDisputeResponse,
} from '@/types/market'
import type { NormalizedTweetMetrics } from '@/types/tweet'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DesignInput {
  tweetId:        string
  tweetText:      string
  tweetCreatedAt: string
  currentMetrics: NormalizedTweetMetrics
  metricType:     MetricType
  durationHours:  number
  followerCount?: number
  tweetAgeMinutes: number
}

export interface GuardInput {
  marketConfig:   GenLayerDesignResponse
  tweetText:      string
  tweetId:        string
  creatorWallet:  string
  marketsToday:   number
  activeTweetMarkets: number
}

export interface DisputeInput {
  tweetId:        string
  metricType:     MetricType
  ranges:         Range[]
  startValue:     number
  marketEndTime:  string
  xApiResult?:    number
  snapshots?:     Array<{ timestamp: string; value: number }>
  disputeReason:  string
}

// ─── Routing ──────────────────────────────────────────────────────────────────

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (process.env.GENLAYER_MOCK_MODE === 'true') {
    throw new Error('Mock mode: use mock functions directly')
  }

  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(systemPrompt, userPrompt)
  }

  throw new Error('No AI backend configured. Set OPENAI_API_KEY.')
}

async function callAIWithContract(fn: string, inputJson: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (process.env.GENLAYER_MOCK_MODE === 'true') {
    throw new Error('Mock mode: use mock functions directly')
  }

  // Prefer GenLayer Studionet intelligent contract when contract address is set
  if (process.env.GENLAYER_CONTRACT_ADDRESS) {
    try {
      return await callGenLayerContract(fn, inputJson)
    } catch {
      // Fall through to OpenAI if GenLayer fails (e.g. not yet deployed)
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(systemPrompt, userPrompt)
  }

  throw new Error('No AI backend configured. Set GENLAYER_CONTRACT_ADDRESS or OPENAI_API_KEY.')
}

async function callGenLayerContract(fn: string, inputJson: string): Promise<string> {
  // Dynamically import genlayer-js to avoid breaking SSR when not configured
  const { createClient, chains } = await import('genlayer-js')
  const studionet = chains.studionet
  const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS as `0x${string}`
  if (!contractAddress) throw new Error('GENLAYER_CONTRACT_ADDRESS not set')

  const clientOpts: Record<string, unknown> = { chain: studionet }
  if (process.env.GENLAYER_NODE_URL) clientOpts.endpoint = process.env.GENLAYER_NODE_URL

  const client = createClient(clientOpts as any)
  const result = await (client as any).readContract({
    address:       contractAddress,
    functionName:  fn,
    args:          [inputJson],
    stateStatus:   'accepted',
  })
  return typeof result === 'string' ? result : JSON.stringify(result)
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
      temperature:    0,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

function parseStrictJSON(raw: string): unknown {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`GenLayer returned non-JSON output: ${raw.slice(0, 200)}`)
  }
}

// ─── 1. Market Designer ───────────────────────────────────────────────────────

const DESIGNER_SYSTEM = `You are designing a prediction market for Xen. Xen markets are USDC-settled range markets on Arc. Your job is to generate fair, time-aware ranges for the final total value of one tweet metric at market expiry.

Rules:
- Use FINAL TOTAL metric value, not additional growth.
- Do not create odds or guarantee payouts.
- Generate 4-6 non-overlapping ranges sorted ascending.
- Ranges must start at or above the current metric value.
- Adapt ranges to selected duration: 1h = tight ranges, 48h = wide ranges.
- Last range must have max: null (open-ended).
- Use creator history, current velocity, tweet age, and selected duration.
- Return STRICT JSON ONLY. No markdown. No explanation outside JSON.`

function validateDesignOutput(raw: unknown, input: DesignInput): GenLayerDesignResponse {
  const d = raw as Record<string, unknown>

  if (typeof d.approved !== 'boolean') throw new Error('approved must be boolean')
  if (!d.approved) throw new Error(`GenLayer rejected market: ${d.reason}`)
  if (d.market_type !== 'range_prediction') throw new Error('market_type must be range_prediction')

  const validMetrics: MetricType[] = ['FINAL_VIEWS', 'FINAL_LIKES', 'FINAL_REPOSTS', 'FINAL_REPLIES']
  const metricType = (d.metric_type as string)?.toUpperCase() as MetricType
  if (!validMetrics.includes(metricType)) throw new Error(`Invalid metric_type: ${d.metric_type}`)

  const validDurations = [1, 3, 6, 12, 24, 48]
  if (!validDurations.includes(d.duration_hours as number))
    throw new Error(`Invalid duration_hours: ${d.duration_hours}`)

  const ranges = d.ranges as Range[]
  if (!Array.isArray(ranges) || ranges.length < 4 || ranges.length > 6)
    throw new Error('ranges must be array of 4-6')

  validateRanges(ranges, input.currentMetrics, input.metricType, input.durationHours)

  const reason = String(d.reason ?? '')
  if (reason.length > 500) throw new Error('reason too long')

  return {
    approved:       true,
    marketType:     'range_prediction',
    metricType:     input.metricType,
    displayMetric:  String(d.display_metric ?? ''),
    durationHours:  d.duration_hours as number,
    startValue:     d.start_value as number,
    ranges,
    riskScore:      (d.risk_score as number) ?? 0,
    qualityScore:   (d.quality_score as number) ?? 0,
    reason,
  }
}

function validateRanges(ranges: Range[], metrics: NormalizedTweetMetrics, metricType: MetricType, durationHours: number) {
  const currentValue = getMetricValue(metrics, metricType) ?? 0

  if (ranges[0].min < currentValue)
    throw new Error(`First range min ${ranges[0].min} below currentValue ${currentValue}`)

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]
    const isLast = i === ranges.length - 1

    if (typeof r.difficulty !== 'number' || r.difficulty < 1 || r.difficulty > 10)
      throw new Error(`Range ${i} difficulty out of bounds`)

    if (isLast) {
      if (!r.maxOpen || r.max !== null) throw new Error('Last range must be maxOpen with max null')
    } else {
      if (r.maxOpen || r.max === null) throw new Error(`Range ${i} must not be open-ended`)
      if ((r.max as number) <= r.min)   throw new Error(`Range ${i}: max <= min`)
      if (ranges[i + 1].min !== r.max)  throw new Error(`Range ${i + 1} min must equal range ${i} max`)
    }
  }
}

function getMetricValue(m: NormalizedTweetMetrics, type: MetricType): number | null {
  switch (type) {
    case 'FINAL_VIEWS':   return m.views
    case 'FINAL_LIKES':   return m.likes
    case 'FINAL_REPOSTS': return m.reposts
    case 'FINAL_REPLIES': return m.replies
  }
}

export async function designMarket(input: DesignInput): Promise<GenLayerDesignResponse> {
  if (process.env.GENLAYER_MOCK_MODE === 'true') return mockDesignMarket(input)

  const currentValue = getMetricValue(input.currentMetrics, input.metricType) ?? 0

  const userPrompt = JSON.stringify({
    tweet_id:          input.tweetId,
    tweet_text:        (input.tweetText ?? '').slice(0, 280),
    tweet_age_minutes: input.tweetAgeMinutes,
    selected_metric:   input.metricType,
    current_value:     currentValue,
    current_metrics:   input.currentMetrics,
    selected_duration_hours: input.durationHours,
    follower_count:    input.followerCount ?? null,
    instructions:      'Generate market ranges. Return JSON matching the schema.',
    schema: {
      approved:       'boolean',
      market_type:    '"range_prediction"',
      metric_type:    'MetricType enum',
      display_metric: 'string',
      duration_hours: 'number',
      start_value:    'number (equals current_value)',
      ranges: [{
        min:        'number',
        max:        'number|null',
        maxOpen:    'boolean',
        label:      'string',
        difficulty: '1-10',
      }],
      risk_score:    '0-10',
      quality_score: '0-10',
      reason:        'string under 500 chars',
    },
  })

  let raw: string
  try {
    raw = await callAIWithContract('design_market', userPrompt, DESIGNER_SYSTEM, userPrompt)
  } catch (e) {
    throw new Error(`GenLayer Designer call failed: ${(e as Error).message}`)
  }

  const parsed = parseStrictJSON(raw)
  return validateDesignOutput(parsed, input)
}

// ─── 2. Market Guard ──────────────────────────────────────────────────────────

const GUARD_SYSTEM = `You are the safety and eligibility guard for Xen prediction markets.
Review the proposed market and approve or reject it. Return STRICT JSON ONLY.

Reject if:
- Tweet promotes scams, harassment, or harmful content
- Metric is unavailable
- Tweet is older than 3 hours
- Ranges are nonsensical
- User exceeded 10 markets/day
- Tweet already has 3 active markets for the same metric/duration
- Market duplicates an existing active market

Return JSON with: { "approved": boolean, "risk_score": 0-10, "rejection_reason": string|null, "flags": string[] }`

export async function guardMarket(input: GuardInput): Promise<GenLayerGuardResponse> {
  if (process.env.GENLAYER_MOCK_MODE === 'true') return mockGuardMarket(input)

  const userPrompt = JSON.stringify({
    tweet_text:           input.tweetText,
    tweet_id:             input.tweetId,
    creator_wallet:       input.creatorWallet,
    markets_today:        input.marketsToday,
    active_tweet_markets: input.activeTweetMarkets,
    proposed_market:      input.marketConfig,
  })

  let raw: string
  try {
    raw = await callAIWithContract('guard_market', userPrompt, GUARD_SYSTEM, userPrompt)
  } catch (e) {
    throw new Error(`GenLayer Guard call failed: ${(e as Error).message}`)
  }

  const parsed = parseStrictJSON(raw) as Record<string, unknown>

  if (typeof parsed.approved !== 'boolean') throw new Error('Guard: approved must be boolean')

  return {
    approved:        parsed.approved as boolean,
    riskScore:       (parsed.risk_score as number) ?? 0,
    rejectionReason: (parsed.rejection_reason as string) ?? null,
    flags:           (parsed.flags as string[]) ?? [],
  }
}

// ─── 3. Dispute Resolver ─────────────────────────────────────────────────────

const DISPUTE_SYSTEM = `You are the dispute resolver for Xen prediction markets.
Given market rules, ranges, available X API data, and the dispute reason,
determine the correct outcome. Return STRICT JSON ONLY.

Return JSON:
{
  "status": "resolved" | "void" | "unresolvable",
  "final_value": number|null,
  "winning_range_index": number|null,
  "confidence": 0-100,
  "reason": "short explanation under 300 chars. No markdown."
}`

export async function resolveDispute(input: DisputeInput): Promise<GenLayerDisputeResponse> {
  if (process.env.GENLAYER_MOCK_MODE === 'true') return mockResolveDispute(input)

  const userPrompt = JSON.stringify({
    tweet_id:          input.tweetId,
    metric_type:       input.metricType,
    ranges:            input.ranges,
    start_value:       input.startValue,
    market_end_time:   input.marketEndTime,
    x_api_final_value: input.xApiResult ?? null,
    snapshots:         input.snapshots  ?? [],
    dispute_reason:    input.disputeReason,
  })

  let raw: string
  try {
    raw = await callAIWithContract('resolve_dispute', userPrompt, DISPUTE_SYSTEM, userPrompt)
  } catch (e) {
    throw new Error(`GenLayer Dispute call failed: ${(e as Error).message}`)
  }

  const parsed = parseStrictJSON(raw) as Record<string, unknown>

  const validStatuses = ['resolved', 'void', 'unresolvable']
  const status = parsed.status as string
  if (!validStatuses.includes(status)) throw new Error(`Dispute: invalid status ${status}`)

  if (status === 'resolved') {
    if (typeof parsed.final_value !== 'number') throw new Error('Dispute: final_value required when resolved')
    if (typeof parsed.winning_range_index !== 'number') throw new Error('Dispute: winning_range_index required')
  }

  const confidence = (parsed.confidence as number) ?? 0
  if (confidence < 0 || confidence > 100) throw new Error('Dispute: confidence out of range')

  return {
    status:             status as GenLayerDisputeResponse['status'],
    finalValue:         (parsed.final_value as number) ?? null,
    winningRangeIndex:  (parsed.winning_range_index as number) ?? null,
    confidence,
    reason:             String(parsed.reason ?? ''),
  }
}

// ─── Mock adapter (dev/test only) ─────────────────────────────────────────────

function mockDesignMarket(input: DesignInput): GenLayerDesignResponse {
  const currentValue = getMetricValue(input.currentMetrics, input.metricType) ?? 1000
  const multiplier = input.durationHours <= 3 ? 1.5 : input.durationHours <= 12 ? 3 : 8

  const step1 = Math.ceil(currentValue * 1.3)
  const step2 = Math.ceil(currentValue * multiplier * 0.6)
  const step3 = Math.ceil(currentValue * multiplier)
  const step4 = Math.ceil(currentValue * multiplier * 1.8)

  const ranges: Range[] = [
    { min: currentValue, max: step1,  maxOpen: false, label: `${formatK(currentValue)}-${formatK(step1)}`, difficulty: 3 },
    { min: step1,        max: step2,  maxOpen: false, label: `${formatK(step1)}-${formatK(step2)}`,        difficulty: 5 },
    { min: step2,        max: step3,  maxOpen: false, label: `${formatK(step2)}-${formatK(step3)}`,        difficulty: 7 },
    { min: step3,        max: step4,  maxOpen: false, label: `${formatK(step3)}-${formatK(step4)}`,        difficulty: 8 },
    { min: step4,        max: null,   maxOpen: true,  label: `${formatK(step4)}+`,                         difficulty: 10 },
  ]

  return {
    approved:     true,
    marketType:   'range_prediction',
    metricType:   input.metricType,
    displayMetric: input.metricType === 'FINAL_VIEWS' ? 'views/impressions' : input.metricType.toLowerCase().replace('final_', ''),
    durationHours: input.durationHours,
    startValue:    currentValue,
    ranges,
    riskScore:     3,
    qualityScore:  8,
    reason:        '[MOCK] Ranges generated deterministically for development.',
  }
}

function mockGuardMarket(_input: GuardInput): GenLayerGuardResponse {
  return { approved: true, riskScore: 2, rejectionReason: null, flags: ['[MOCK]'] }
}

function mockResolveDispute(input: DisputeInput): GenLayerDisputeResponse {
  if (input.xApiResult != null) {
    const idx = input.ranges.findIndex(r => {
      if (r.maxOpen) return input.xApiResult! >= r.min
      return input.xApiResult! >= r.min && input.xApiResult! < (r.max as number)
    })
    return {
      status:            idx >= 0 ? 'resolved' : 'void',
      finalValue:        input.xApiResult,
      winningRangeIndex: idx >= 0 ? idx : null,
      confidence:        85,
      reason:            '[MOCK] Resolved using provided X API value.',
    }
  }
  return {
    status:            'unresolvable',
    finalValue:        null,
    winningRangeIndex: null,
    confidence:        0,
    reason:            '[MOCK] No data available.',
  }
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
