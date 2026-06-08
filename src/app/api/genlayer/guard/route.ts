/**
 * POST /api/genlayer/guard
 * Validates a proposed market via GenLayer Market Guard.
 * If approved, returns a signed MarketConfig for on-chain market creation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireXAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { guardMarket } from '@/lib/genlayer'
import { hashRanges, hashQuestion, hashGenLayerReport } from '@/lib/arc-contracts'
import { hashXUserId } from '@/lib/crypto'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http, keccak256, toHex } from 'viem'
import { arcChain } from '@/config/chains'
import { CONTRACT_ADDRESSES } from '@/config/contracts'
import type { MetricType, GenLayerDesignResponse } from '@/types/market'
import { metricTypeToIndex } from '@/lib/utils'

const SIGNER_KEY = process.env.RESOLVER_PRIVATE_KEY as `0x${string}`

export async function POST(req: NextRequest) {
  let sessionUser
  try {
    sessionUser = await requireXAuth()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 })
  }

  const { tweetId, metricType, durationHours, design } = await req.json() as {
    tweetId:       string
    metricType:    MetricType
    durationHours: number
    design:        GenLayerDesignResponse
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { walletAddress: sessionUser.walletAddress },
  })

  // Daily limit check
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const marketsToday = await prisma.market.count({
    where: { creatorWallet: user.walletAddress, createdAt: { gte: todayStart } },
  })
  if (marketsToday >= 10) {
    return NextResponse.json({ error: 'Daily market limit reached (10/day)' }, { status: 429 })
  }

  // Tweet market cap
  const activeTweetMarkets = await prisma.market.count({
    where: { tweetId, state: { in: ['OPEN', 'LOCKED'] } },
  })
  if (activeTweetMarkets >= 3) {
    return NextResponse.json({ error: 'This tweet already has 3 active markets' }, { status: 409 })
  }

  // GenLayer guard
  let guard
  try {
    guard = await guardMarket({
      marketConfig:       design,
      tweetText:          '',
      tweetId,
      creatorWallet:      user.walletAddress,
      marketsToday,
      activeTweetMarkets,
    })
  } catch (e) {
    return NextResponse.json({ error: `GenLayer Guard error: ${(e as Error).message}` }, { status: 502 })
  }

  if (!guard.approved) {
    return NextResponse.json({ error: guard.rejectionReason ?? 'Market rejected by guard', flags: guard.flags }, { status: 422 })
  }

  // Build signed MarketConfig
  const nonce      = BigInt(Date.now())
  const now        = BigInt(Math.floor(Date.now() / 1000))
  const endTime    = now + BigInt(durationHours * 3600)
  const rangesHash = hashRanges(design.ranges)
  const qHash      = hashQuestion(tweetId, metricType, durationHours)
  const reportStr  = JSON.stringify({ design, guard, generatedAt: new Date().toISOString() })
  const reportHash = hashGenLayerReport(reportStr)
  const xUserIdHash = hashXUserId(user.xUserId!) as `0x${string}`

  if (!SIGNER_KEY) {
    return NextResponse.json({ error: 'RESOLVER_PRIVATE_KEY not configured' }, { status: 500 })
  }

  const account = privateKeyToAccount(SIGNER_KEY)

  // EIP-712 domain
  const domain = {
    name:              'Xen',
    version:           '1',
    chainId:           arcChain.id,
    verifyingContract: CONTRACT_ADDRESSES.XEN_FACTORY,
  }

  const types = {
    MarketConfig: [
      { name: 'creator',            type: 'address' },
      { name: 'xUserIdHash',        type: 'bytes32' },
      { name: 'tweetId',            type: 'string'  },
      { name: 'metricType',         type: 'uint8'   },
      { name: 'startValue',         type: 'uint256' },
      { name: 'createdAt',          type: 'uint256' },
      { name: 'marketStartTime',    type: 'uint256' },
      { name: 'marketEndTime',      type: 'uint256' },
      { name: 'rangesHash',         type: 'bytes32' },
      { name: 'marketQuestionHash', type: 'bytes32' },
      { name: 'genLayerReportHash', type: 'bytes32' },
      { name: 'nonce',              type: 'uint256' },
    ],
  }

  const configValue = {
    creator:            user.walletAddress as `0x${string}`,
    xUserIdHash:        xUserIdHash as `0x${string}`,
    tweetId,
    metricType:         metricTypeToIndex(metricType),
    startValue:         BigInt(design.startValue),
    createdAt:          now,
    marketStartTime:    now,
    marketEndTime:      endTime,
    rangesHash:         rangesHash as `0x${string}`,
    marketQuestionHash: qHash as `0x${string}`,
    genLayerReportHash: reportHash as `0x${string}`,
    nonce,
  }

  const client = createWalletClient({
    account,
    chain:     arcChain,
    transport: http(arcChain.rpcUrls.default.http[0]),
  })

  const signature = await account.signTypedData({ domain, types, primaryType: 'MarketConfig', message: configValue })

  // Store pending market in DB
  const dbMarket = await prisma.market.create({
    data: {
      creatorWallet:       user.walletAddress,
      xUserIdHash,
      tweetId,
      metricType:          metricType as any,
      startValue:          BigInt(design.startValue),
      durationHours,
      expiresAt:           new Date(Date.now() + durationHours * 3600 * 1000),
      state:               'OPEN',
      rangesJson:          design.ranges as any,
      genLayerRequestJson: { tweetId, metricType, durationHours } as any,
      genLayerResponseJson: { design, guard } as any,
      genLayerReportHash:  reportHash,
    },
  })

  return NextResponse.json({
    guardResult: guard,
    marketDbId:  dbMarket.id,
    config: {
      ...configValue,
      startValue:      configValue.startValue.toString(),
      createdAt:       configValue.createdAt.toString(),
      marketStartTime: configValue.marketStartTime.toString(),
      marketEndTime:   configValue.marketEndTime.toString(),
      nonce:           configValue.nonce.toString(),
    },
    ranges:    design.ranges,
    signature,
  })
}
