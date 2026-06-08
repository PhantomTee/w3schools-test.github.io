import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MetricType } from '@/types/market'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUSDC(rawAmount: bigint | string, decimals = 6): string {
  const n = BigInt(rawAmount)
  const whole = n / BigInt(10 ** decimals)
  const frac  = n % BigInt(10 ** decimals)
  if (frac === 0n) return `${whole.toLocaleString()}`
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${whole.toLocaleString()}.${fracStr}`
}

export function parseUSDC(amount: number): bigint {
  return BigInt(Math.round(amount * 1_000_000))
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

export function formatAge(createdAt: string): string {
  const ms  = Date.now() - new Date(createdAt).getTime()
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export function tweetAgeMinutes(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 60_000
}

export function metricLabel(type: MetricType): string {
  switch (type) {
    case 'FINAL_VIEWS':   return 'Views / Impressions'
    case 'FINAL_LIKES':   return 'Likes'
    case 'FINAL_REPOSTS': return 'Reposts'
    case 'FINAL_REPLIES': return 'Replies'
  }
}

export function metricField(type: MetricType): string {
  switch (type) {
    case 'FINAL_VIEWS':   return 'impression_count'
    case 'FINAL_LIKES':   return 'like_count'
    case 'FINAL_REPOSTS': return 'retweet_count'
    case 'FINAL_REPLIES': return 'reply_count'
  }
}

export function metricTypeToIndex(type: MetricType): number {
  return ['FINAL_VIEWS', 'FINAL_LIKES', 'FINAL_REPOSTS', 'FINAL_REPLIES'].indexOf(type)
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function timeUntil(dateStr: string): string {
  const ms = new Date(dateStr).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ${min % 60}m`
  return `${Math.floor(hr / 24)}d ${hr % 24}h`
}

export function stateColor(state: string): string {
  switch (state) {
    case 'OPEN':      return 'text-green-400'
    case 'LOCKED':    return 'text-yellow-400'
    case 'RESOLVED':  return 'text-blue-400'
    case 'VOIDED':    return 'text-red-400'
    case 'CANCELLED': return 'text-gray-400'
    default:          return 'text-gray-400'
  }
}

export function randomHex(bytes = 32): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return '0x' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const DURATION_OPTIONS = [
  { label: '1 hour',   value: 1  },
  { label: '3 hours',  value: 3  },
  { label: '6 hours',  value: 6  },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
] as const

export const METRIC_OPTIONS: { label: string; value: MetricType; available: boolean }[] = [
  { label: 'Views / Impressions', value: 'FINAL_VIEWS',   available: true  },
  { label: 'Likes',               value: 'FINAL_LIKES',   available: true  },
  { label: 'Reposts',             value: 'FINAL_REPOSTS', available: true  },
  { label: 'Replies',             value: 'FINAL_REPLIES', available: true  },
]
