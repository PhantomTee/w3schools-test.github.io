'use client'
import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const { disconnect }           = useDisconnect()
  const qc                       = useQueryClient()
  const [xDisconnecting, setXDisconnecting] = useState(false)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
  })
  const me = meData?.user

  async function handleDisconnectWallet() {
    await fetch('/api/auth/wallet', { method: 'DELETE' })
    disconnect()
    await qc.invalidateQueries({ queryKey: ['me'] })
  }

  async function handleDisconnectX() {
    setXDisconnecting(true)
    try {
      await fetch('/api/auth/x/connect', { method: 'DELETE' })
      await qc.invalidateQueries({ queryKey: ['me'] })
    } catch {
      // silently fail — user can retry
    } finally {
      setXDisconnecting(false)
    }
  }

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Settings</h1>
          <p className="text-[14px] text-[#64748B]">Manage your connected accounts and preferences</p>
        </div>

        <div className="space-y-4">
          {/* Wallet */}
          <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Wallet</h2>
              {isConnected && me && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">Connected</span>
              )}
            </div>

            {isConnected && address ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Address</p>
                  <p className="text-[14px] font-mono text-[#94A3B8]">{address}</p>
                </div>
                {me && (
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/[0.05] text-[13px]">
                    <div>
                      <p className="text-[12px] text-[#64748B] mb-1">Markets created today</p>
                      <p className="text-[#F8FAFC] font-medium tabular-nums">{me.marketsCreatedToday} / 10</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#64748B] mb-1">Total markets created</p>
                      <p className="text-[#F8FAFC] font-medium tabular-nums">{me.totalMarketsCreated}</p>
                    </div>
                  </div>
                )}
                <Button variant="destructive" size="sm" onClick={handleDisconnectWallet}>
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              <p className="text-[14px] text-[#64748B]">No wallet connected.</p>
            )}
          </div>

          {/* X account */}
          <div className="rounded-[24px] bg-[#0B1220] border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#F8FAFC]">X Account</h2>
              {me?.xUsername && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">Verified</span>
              )}
            </div>

            {me?.xUsername ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Handle</p>
                  <p className="text-[14px] text-[#F8FAFC]">@{me.xUsername}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Connected since</p>
                  <p className="text-[14px] text-[#94A3B8]">{new Date(me.xConnectedAt).toLocaleDateString()}</p>
                </div>
                <p className="text-[12px] text-[#64748B] leading-relaxed">
                  Disconnecting X removes your ability to create new markets. Existing markets
                  are not affected.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnectX}
                  disabled={xDisconnecting}
                >
                  {xDisconnecting ? 'Disconnecting...' : 'Disconnect X'}
                </Button>
              </div>
            ) : me ? (
              <div className="space-y-3">
                <p className="text-[14px] text-[#64748B]">
                  Connect X to create markets from your fresh tweets.
                </p>
                <a href="/api/auth/x/connect">
                  <Button variant="outline" size="sm">Connect X Account</Button>
                </a>
              </div>
            ) : (
              <p className="text-[14px] text-[#64748B]">Connect your wallet first.</p>
            )}
          </div>

          {/* Market rules */}
          <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] p-6">
            <h2 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">Market rules</h2>
            <ul className="space-y-2 text-[13px] text-[#64748B]">
              <li>Maximum 10 markets per wallet per day.</li>
              <li>Maximum 3 markets per tweet across all metrics.</li>
              <li>Only tweets posted after X connection are eligible.</li>
              <li>Creation window closes 3 hours after the tweet is posted.</li>
              <li>Maximum market duration is 48 hours.</li>
              <li>Creation fee is 0.5 USDC per market.</li>
              <li>Protocol fee is 1% of the total pool at resolution.</li>
              <li>Creators cannot place predictions on their own markets.</li>
            </ul>
          </div>

          {/* Data sources */}
          <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] p-6">
            <h2 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">Data sources and settlement</h2>
            <div className="space-y-3 text-[13px]">
              {[
                { label: 'Metric source',      value: 'X API public_metrics' },
                { label: 'Resolution method',  value: 'X API at expiry, GenLayer fallback' },
                { label: 'Settlement network', value: 'Arc EVM' },
                { label: 'Settlement token',   value: 'USDC' },
                { label: 'Range intelligence', value: 'GenLayer' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[#64748B]">{label}</span>
                  <span className="text-[#94A3B8]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk notice */}
          <div className="rounded-[24px] bg-[#080D14] border border-white/[0.04] p-6">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] mb-3">Risk notice</h2>
            <p className="text-[13px] text-[#64748B] leading-relaxed">
              Participation in prediction markets involves financial risk. Staked USDC may be lost
              if your prediction is incorrect. Markets may void if final metrics cannot be verified
              at settlement — staked USDC is fully refunded in void cases. This is not financial
              advice. Participation is subject to the laws of your jurisdiction.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
