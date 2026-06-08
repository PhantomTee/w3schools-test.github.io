/**
 * Wallet authentication via SIWE (Sign In With Ethereum).
 * GET  /api/auth/wallet         → get nonce
 * POST /api/auth/wallet         → verify signature, create session
 * DELETE /api/auth/wallet       → sign out
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { createPublicClient, http, verifyMessage } from 'viem'
import { arcChain } from '@/config/chains'
import crypto from 'crypto'

export async function GET() {
  const nonce = crypto.randomBytes(16).toString('hex')
  const session = await getSession()
  session.siweNonce = nonce
  await session.save()
  return NextResponse.json({ nonce })
}

export async function POST(req: NextRequest) {
  const { address, message, signature } = await req.json()

  if (!address || !message || !signature) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getSession()
  if (!session.siweNonce) {
    return NextResponse.json({ error: 'No nonce in session. Call GET first.' }, { status: 400 })
  }

  // Verify nonce is in message
  if (!message.includes(session.siweNonce)) {
    return NextResponse.json({ error: 'Nonce mismatch' }, { status: 400 })
  }

  // Verify signature
  let valid = false
  try {
    valid = await verifyMessage({ address, message, signature })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (!valid) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
  }

  // Upsert user
  const user = await prisma.user.upsert({
    where:  { walletAddress: address.toLowerCase() },
    create: { walletAddress: address.toLowerCase() },
    update: { updatedAt: new Date() },
  })

  session.user = {
    walletAddress: user.walletAddress,
    xUserId:       user.xUserId    ?? undefined,
    xUsername:     user.xUsername  ?? undefined,
    xConnectedAt:  user.xConnectedAt?.toISOString() ?? undefined,
  }
  session.siweNonce = undefined
  await session.save()

  return NextResponse.json({ ok: true, walletAddress: user.walletAddress })
}

export async function DELETE() {
  const session = await getSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}
