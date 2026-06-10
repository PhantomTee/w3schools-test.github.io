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

  const { data: me, isLoading: meLoading } = useQuery({
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

  // Only show sign-in modal once the session query has settled — avoids
  // flashing the modal on page load while the cookie check is in-flight.
  useEffect(() => {
    if (meLoading) return
    if (isConnected && !isAuthed) {
      setShowSignIn(true)
    } else {
      setShowSignIn(false)
    }
  }, [isConnected, isAuthed, meLoading])

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
            className="absolute inset-0 bg-black/50"
            onClick={handleDisconnectFromModal}
          />

          {/* Modal — drawn box */}
          <div className="relative z-10 w-[340px] mx-4 sketch-card overflow-hidden">
            <div className="p-6">
              <h2 className="text-[30px] text-[var(--text-primary)] mb-1 leading-none">
                Sign in
              </h2>
              <p className="text-[16px] text-[var(--text-muted)] mb-5">
                Prove wallet ownership. No gas, no transaction — just a signature.
              </p>

              {/* Wallet address pill */}
              <div className="flex items-center gap-2 px-3 py-2 mb-5 border-2 border-[var(--ink)] rounded-[4px] [filter:url(#hand-draw)]">
                <span className="h-2 w-2 rounded-full bg-[var(--ink)] shrink-0" />
                <span className="text-[14px] text-[var(--text-primary)] truncate">{address}</span>
              </div>

              {signError && (
                <p className="text-[15px] text-[var(--xen-red)] mb-4 leading-snug">{signError}</p>
              )}

              <Button
                variant="filled"
                className="w-full mb-2"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? 'Waiting for signature…' : 'Sign in via wallet'}
              </Button>

              <button
                onClick={handleDisconnectFromModal}
                className="w-full text-center text-[15px] text-[var(--text-muted)] hover:text-[var(--text-primary)] py-1.5 transition-colors underline underline-offset-4"
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] border-2 border-[var(--ink)] bg-[var(--paper)] [box-shadow:2px_2px_0_var(--ink)] hover:[box-shadow:3px_3px_0_var(--ink)] active:translate-x-[1px] active:translate-y-[1px] active:[box-shadow:1px_1px_0_var(--ink)] [filter:url(#hand-draw)] transition-all duration-100 text-[15px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)] shrink-0" />
            <span className="text-[14px] text-[var(--text-primary)]">{shortenAddress(address!)}</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 sketch-card p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 text-[15px] text-[var(--text-muted)] border-b-2 border-[var(--border-soft)] mb-1">
                  {me?.user?.marketsCreatedToday ?? 0} / 10 markets today
                </div>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-[16px] rounded-[4px] text-[var(--xen-red)] hover:bg-[var(--bg-elevated)] transition-colors"
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
