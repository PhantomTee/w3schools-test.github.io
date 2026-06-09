'use client'
import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()
  const { signMessageAsync }     = useSignMessage()
  const [open, setOpen]          = useState(false)
  const [loading, setLoading]    = useState(false)
  const qc = useQueryClient()

  const { data: me } = useQuery({
    queryKey:  ['me'],
    queryFn:   () => fetch('/api/auth/me').then(r => r.json()),
    staleTime: 60_000,
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
    try {
      const { nonce } = await fetch('/api/auth/wallet').then(r => r.json())
      const message   = `Sign in to Xen\n\nWallet: ${address}\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })
      await fetch('/api/auth/wallet', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, message, signature }),
      })
      await qc.invalidateQueries({ queryKey: ['me'] })
    } catch (e) {
      console.error('Sign in error:', e)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  async function handleDisconnect() {
    await fetch('/api/auth/wallet', { method: 'DELETE' })
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
      <Button variant="outline" size="sm" onClick={handleSignIn} disabled={loading}>
        {loading ? 'Signing...' : 'Sign In'}
      </Button>
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
