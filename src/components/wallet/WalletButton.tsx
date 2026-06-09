'use client'
import { useState } from 'react'
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
  const [open, setOpen]          = useState(false)
  const [loading, setLoading]    = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
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

  async function handleConnect() {
    const connector = connectors[0]
    if (!connector) return
    setLoading(true)
    try { connect({ connector }) } finally { setLoading(false) }
  }

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
    } catch (e) {
      setSignError((e as Error).message)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  async function handleDisconnect() {
    await fetch('/api/auth/wallet', { method: 'DELETE' }).catch(() => {})
    disconnect()
    await qc.invalidateQueries({ queryKey: ['me'] })
    setOpen(false)
  }

  if (!isConnected) {
    return (
      <Button variant="xen" size="sm" onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    )
  }

  if (!isAuthed) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing...' : 'Sign In'}
        </Button>
        {signError && (
          <p className="text-[11px] text-[#EF4444] max-w-[200px] text-right">{signError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-[13px] text-[#94A3B8]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
        <span className="font-mono text-xs">{shortenAddress(address!)}</span>
        {me?.user?.xUsername && (
          <span className="text-[#64748B] text-xs">@{me.user.xUsername}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-[16px] border border-white/[0.08] bg-[#0B1220] shadow-2xl p-2 z-50 animate-fade-in">
          <div className="px-3 py-2 text-[12px] text-[#64748B] border-b border-white/[0.06] mb-1">
            {me?.user?.marketsCreatedToday ?? 0} / 10 markets today
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full text-left px-3 py-2 text-[13px] rounded-[10px] text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
