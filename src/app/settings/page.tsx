'use client'

import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Me {
  walletAddress?: string | null
  xUsername?: string | null
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function SettingsPage() {
  const { data: me } = useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return {}
      return res.json()
    },
  })

  async function handleDisconnectX() {
    // Stub: will call /api/auth/x/disconnect when implemented
    console.log('Disconnect X stub')
  }

  return (
    <AppShell>
      <div className="max-w-[520px] mx-auto px-4 pt-6 pb-12">

        {/* Wallet */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-3">
          <p
            style={{ fontSize: 11 }}
            className="text-[var(--text-muted)] uppercase tracking-wider mb-2"
          >
            Wallet
          </p>
          {me?.walletAddress ? (
            <p
              style={{ fontSize: 13 }}
              className="text-[var(--text-primary)] font-mono"
            >
              {truncateAddress(me.walletAddress)}
            </p>
          ) : (
            <p style={{ fontSize: 13 }} className="text-[var(--text-muted)]">
              Not connected
            </p>
          )}
        </div>

        {/* X Account */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-3">
          <p
            style={{ fontSize: 11 }}
            className="text-[var(--text-muted)] uppercase tracking-wider mb-2"
          >
            X Account
          </p>
          {me?.xUsername ? (
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 13 }} className="text-[var(--text-primary)]">
                @{me.xUsername}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectX}
              >
                Disconnect X
              </Button>
            </div>
          ) : (
            <p style={{ fontSize: 13 }} className="text-[var(--text-muted)]">
              Not connected
            </p>
          )}
        </div>

        {/* Theme */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-3">
          <p
            style={{ fontSize: 11 }}
            className="text-[var(--text-muted)] uppercase tracking-wider mb-2"
          >
            Theme
          </p>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 13 }} className="text-[var(--text-secondary)]">
              Appearance
            </p>
            <ThemeToggle />
          </div>
        </div>

        {/* About */}
        <div className="bg-[var(--bg-elevated)] rounded-[16px] p-4 border border-[var(--border-soft)] mb-3">
          <p
            style={{ fontSize: 11 }}
            className="text-[var(--text-muted)] uppercase tracking-wider mb-2"
          >
            About Xen
          </p>
          <p
            style={{ fontSize: 13 }}
            className="text-[var(--text-secondary)] leading-relaxed"
          >
            Xen is a pari-mutuel range prediction market built on Arc. Markets
            resolve via the X API, with GenLayer as a fallback oracle for
            disputed results. Protocol fee: 1% of pool.
          </p>
        </div>

      </div>
    </AppShell>
  )
}
