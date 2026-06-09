'use client'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'

async function safeJson(res: Response) {
  try { return await res.json() } catch { return {} }
}

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()
  const { signMessageAsync }     = useSignMessage()
  const [open,       setOpen]    = useState(false)
  const [loading,    setLoading] = useState(false)
  const [signError,  setSignError] = useState<string | null>(null)
  const [showSignIn, setShowSignIn] = useState(false)
  const qc = useQueryClient()

  const { data: me } = useQuery({
    queryKey:  ['me'],
    queryFn:   async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return {}
      return safeJson(res)
    },
    staleTime: 60_000,
    retry:     false,
  })

  const isAuthed = !!me?.user?.walletAddress

  // Show sign-in popup when wallet connects but not yet authenticated
  useEffect(() => {
    if (isConnected && !isAuthed) {
      setShowSignIn(true)
    } else {
      setShowSignIn(false)
    }
  }, [isConnected, isAuthed])

  async function handleSignIn() {
    if (!address) return
    setLoading(true)
    setSignError(null)
    try {
      const nonceRes = await fetch('/api/auth/wallet')
      if (!nonceRes.ok) throw new Error(`Server error ${nonceRes.status}`)
      const { nonce } = await safeJson(nonceRes)
      if (!nonce) throw new Error('No nonce returned')

      const message   = `Sign in to Xen\n\nWallet: ${address}\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      const authRes = await fetch('/api/auth/wallet', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, message, signature }),
      })
      if (!authRes.ok) {
        const body = await safeJson(authRes)
        throw new Error(body?.error ?? `Server error ${authRes.status}`)
      }
      await qc.invalidateQueries({ queryKey: ['me'] })
      setShowSignIn(false)
    } catch (e) {
      setSignError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    const connector = connectors[0]
    if (!connector) return
    connect({ connector })
  }

  async function handleDisconnectFromModal() {
    disconnect()
    setShowSignIn(false)
    setSignError(null)
  }

  async function handleDisconnect() {
    await fetch('/api/auth/wallet', { method: 'DELETE' }).catch(() => {})
    disconnect()
    await qc.invalidateQueries({ queryKey: ['me'] })
    setOpen(false)
  }

  return (
    <>
      {/* Sign-in modal overlay */}
      {showSignIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDisconnectFromModal}
          />

          {/* Modal */}
          <div className="relative z-10 w-[340px] mx-4 rounded-[16px] border border-[var(--border-strong)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-[var(--accent-primary)]" />

            <div className="p-6">
              <h2 className="font-display text-[22px] uppercase tracking-tight text-[var(--text-primary)] mb-1">
                Sign in
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] mb-5">
                Prove wallet ownership. No gas, no transaction — just a signature.
              </p>

              {/* Wallet address pill */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-soft)] mb-5">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
                <span className="font-mono text-[12px] text-[var(--text-primary)] truncate">{address}</span>
              </div>

              {signError && (
                <p className="text-[12px] text-red-500 mb-4 leading-snug">{signError}</p>
              )}

              <Button
                variant="xen"
                className="w-full mb-2"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? 'Waiting for signature…' : 'Sign in via wallet'}
              </Button>

              <button
                onClick={handleDisconnectFromModal}
                className="w-full text-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] py-1.5 transition-colors"
              >
                Disconnect wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet button */}
      {!isConnected ? (
        <Button variant="xen" size="sm" onClick={handleConnect}>
          Connect Wallet
        </Button>
      ) : isAuthed ? (
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-active)] transition-all text-[13px] text-[var(--text-secondary)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
            <span className="font-mono text-xs text-[var(--text-primary)]">{shortenAddress(address!)}</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 rounded-[16px] border border-[var(--border-strong)] bg-[var(--bg-card)] shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 text-[12px] text-[var(--text-muted)] border-b border-[var(--border-soft)] mb-1">
                  {me?.user?.marketsCreatedToday ?? 0} / 10 markets today
                </div>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-[13px] rounded-[10px] text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        // Connected but sign-in modal was dismissed — show compact button
        <Button variant="xen" size="sm" onClick={() => setShowSignIn(true)}>
          Sign In
        </Button>
      )}
    </>
  )
}
