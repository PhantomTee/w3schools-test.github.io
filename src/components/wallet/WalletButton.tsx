'use client'
import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import { shortenAddress } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
    try {
      connect({ connector })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn() {
    if (!address) return
    setLoading(true)
    try {
      const { nonce } = await fetch('/api/auth/wallet').then(r => r.json())
      const message = `Sign in to Xen\n\nWallet: ${address}\nNonce: ${nonce}`
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
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  if (!isAuthed) {
    return (
      <Button variant="outline" size="sm" onClick={handleSignIn} disabled={loading}>
        <Wallet className="mr-2 h-4 w-4" />
        {loading ? 'Signing…' : 'Sign In'}
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className="gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        {shortenAddress(address!)}
        {me?.user?.xUsername && (
          <span className="text-muted-foreground text-xs">@{me.user.xUsername}</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg border bg-popover shadow-xl p-1 z-50">
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border mb-1">
            {me?.user?.marketsCreatedToday ?? 0}/10 markets today
          </div>
          <button
            onClick={handleDisconnect}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
