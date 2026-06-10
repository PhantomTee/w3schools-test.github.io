/**
 * Wallet authentication via SIWE (Sign In With Ethereum).
 * GET  /api/auth/wallet  → get nonce
 * POST /api/auth/wallet  → verify signature, create session
 * DELETE /api/auth/wallet → sign out
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { verifyMessage } from 'viem'
import crypto from 'crypto'

export async function GET() {
  try {
    const nonce   = crypto.randomBytes(16).toString('hex')
    const session = await getSession()
    session.siweNonce = nonce
    await session.save()
    return NextResponse.json({ nonce })
  } catch (e) {
    console.error('[wallet/GET]', e)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { address, message, signature } = body

    if (!address || !message || !signature) {
      return NextResponse.json({ error: 'Missing fields: address, message, signature' }, { status: 400 })
    }

    const session = await getSession()
    if (!session.siweNonce) {
      return NextResponse.json({ error: 'No nonce in session — call GET /api/auth/wallet first' }, { status: 400 })
    }

    if (!message.includes(session.siweNonce)) {
      return NextResponse.json({ error: 'Nonce mismatch' }, { status: 400 })
    }

    // Verify signature cryptographically (no RPC call needed)
    let valid = false
    try {
      valid = await verifyMessage({ address, message, signature })
    } catch (e) {
      console.error('[wallet/POST] verifyMessage error:', e)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Upsert user record
    const user = await prisma.user.upsert({
      where:  { walletAddress: address.toLowerCase() },
      create: { walletAddress: address.toLowerCase() },
      update: { updatedAt: new Date() },
    })

    session.user = {
      walletAddress: user.walletAddress,
      xUserId:       user.xUserId      ?? undefined,
      xUsername:     user.xUsername    ?? undefined,
      xConnectedAt:  user.xConnectedAt?.toISOString() ?? undefined,
    }
    session.siweNonce = undefined
    await session.save()

    return NextResponse.json({ ok: true, walletAddress: user.walletAddress })
  } catch (e) {
    console.error('[wallet/POST] unhandled error:', e)
    const msg = e instanceof Error ? e.message : 'Unknown server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    session.destroy()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[wallet/DELETE]', e)
    return NextResponse.json({ error: 'Failed to destroy session' }, { status: 500 })
  }
}
