/**
 * Backend Arc contract interaction using viem.
 * Used by API routes and the resolver cron job.
 * All signing uses the backend resolver key (RESOLVER_PRIVATE_KEY).
 */
import { createPublicClient, createWalletClient, http, keccak256, encodePacked, encodeAbiParameters, parseAbiParameters, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcChain } from '@/config/chains'
import { CONTRACT_ADDRESSES } from '@/config/contracts'
import { XEN_FACTORY_ABI, XEN_MARKET_ABI } from '@/config/abi'
import type { Range } from '@/types/market'

// ─── Clients ──────────────────────────────────────────────────────────────────

export function getPublicClient() {
  return createPublicClient({
    chain:     arcChain,
    transport: http(arcChain.rpcUrls.default.http[0]),
  })
}

export function getResolverWalletClient() {
  const key = process.env.RESOLVER_PRIVATE_KEY
  if (!key) throw new Error('RESOLVER_PRIVATE_KEY not set')
  const account = privateKeyToAccount(key as `0x${string}`)
  return createWalletClient({
    account,
    chain:     arcChain,
    transport: http(arcChain.rpcUrls.default.http[0]),
  })
}

// ─── Market resolution ────────────────────────────────────────────────────────

export async function resolveMarketOnChain(
  marketAddress: string,
  winningRangeIndex: number,
  finalValue: bigint,
  evidenceData: string
): Promise<string> {
  const wallet = getResolverWalletClient()
  const evidenceHash = keccak256(toHex(evidenceData))

  const hash = await wallet.writeContract({
    address:      CONTRACT_ADDRESSES.XEN_RESOLVER,
    abi:          [
      {
        name: 'resolveMarket',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'marketAddress',    type: 'address' },
          { name: 'winningRangeIndex', type: 'uint8'  },
          { name: 'finalValue',       type: 'uint256' },
          { name: 'evidenceHash',     type: 'bytes32' },
        ],
        outputs: [],
      },
    ],
    functionName: 'resolveMarket',
    args:         [marketAddress as `0x${string}`, winningRangeIndex, finalValue, evidenceHash],
  })

  return hash
}

export async function voidMarketOnChain(
  marketAddress: string,
  reason: string
): Promise<string> {
  const wallet = getResolverWalletClient()
  const reasonHash = keccak256(toHex(reason))

  const hash = await wallet.writeContract({
    address:      CONTRACT_ADDRESSES.XEN_RESOLVER,
    abi:          [
      {
        name: 'voidMarket',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'marketAddress', type: 'address' },
          { name: 'reasonHash',    type: 'bytes32' },
        ],
        outputs: [],
      },
    ],
    functionName: 'voidMarket',
    args:         [marketAddress as `0x${string}`, reasonHash],
  })

  return hash
}

// ─── Signature helpers ────────────────────────────────────────────────────────

export function hashRanges(ranges: Range[]): `0x${string}` {
  // Mirrors keccak256(abi.encode(ranges)) in Solidity
  const encoded = encodeAbiParameters(
    parseAbiParameters('(uint256 min, uint256 max, bool maxOpen, string label, uint8 difficulty)[]'),
    [ranges.map(r => ({
      min:        BigInt(r.min),
      max:        r.max != null ? BigInt(r.max) : 0n,
      maxOpen:    r.maxOpen,
      label:      r.label,
      difficulty: r.difficulty,
    }))]
  )
  return keccak256(encoded)
}

export function hashQuestion(tweetId: string, metricType: string, durationHours: number): `0x${string}` {
  const q = `What will this tweet's final total ${metricType.replace('FINAL_', '').toLowerCase()} be after ${durationHours} hour(s)? (tweetId: ${tweetId})`
  return keccak256(toHex(q))
}

export function hashGenLayerReport(report: string): `0x${string}` {
  return keccak256(toHex(report))
}

// ─── Market state reader ──────────────────────────────────────────────────────

export async function getMarketStateOnChain(marketAddress: string) {
  const client = getPublicClient()
  const addr   = marketAddress as `0x${string}`

  const [state, totalPool, winningRangeIndex, finalValue, marketEndTime] = await Promise.all([
    client.readContract({ address: addr, abi: XEN_MARKET_ABI, functionName: 'state' }),
    client.readContract({ address: addr, abi: XEN_MARKET_ABI, functionName: 'totalPool' }),
    client.readContract({ address: addr, abi: XEN_MARKET_ABI, functionName: 'winningRangeIndex' }),
    client.readContract({ address: addr, abi: XEN_MARKET_ABI, functionName: 'finalValue' }),
    client.readContract({ address: addr, abi: XEN_MARKET_ABI, functionName: 'marketEndTime' }),
  ])

  return { state, totalPool, winningRangeIndex, finalValue, marketEndTime }
}

export async function getRangePools(marketAddress: string, rangeCount: number): Promise<bigint[]> {
  const client = getPublicClient()
  const addr   = marketAddress as `0x${string}`

  const calls = Array.from({ length: rangeCount }, (_, i) =>
    client.readContract({ address: addr, abi: XEN_MARKET_ABI, functionName: 'rangePool', args: [i] })
  )
  return Promise.all(calls) as Promise<bigint[]>
}
