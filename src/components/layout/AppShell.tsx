'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { Rss, TrendingUp, PlusCircle, Gift, User, Activity, Settings } from 'lucide-react'
import { WalletButton } from '@/components/wallet/WalletButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { usePortfolioBalance } from '@/hooks/usePortfolioBalance'
import { cn } from '@/lib/utils'

const NAV_PRIMARY = [
  { href: '/feed',    label: 'Feed',    icon: Rss         },
  { href: '/markets', label: 'Markets', icon: TrendingUp  },
  { href: '/create',  label: 'Create',  icon: PlusCircle  },
  { href: '/claims',  label: 'Claims',  icon: Gift        },
  { href: '/profile', label: 'Profile', icon: User        },
]

const NAV_SECONDARY = [
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
]

async function safeJson(res: Response) {
  try { return await res.json() } catch { return {} }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isConnected } = useAccount()
  const { cash, portfolio, loading: balanceLoading } = usePortfolioBalance()

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

  function isActive(href: string) {
    if (href === '/feed') return pathname === '/feed' || pathname === '/dashboard'
    return pathname?.startsWith(href) ?? false
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[224px] shrink-0 h-screen sticky top-0 bg-[var(--bg-base)]"
        style={{ borderRight: '2px solid var(--text-primary)', filter: 'url(#hand-draw-lg)' }}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5">
          <Link href="/">
            <span
              className="font-display text-[26px] font-bold text-[var(--text-primary)] tracking-tight"
              style={{ textShadow: '2px 2px 0 var(--accent-primary)' }}
            >
              Xen
            </span>
          </Link>
        </div>

        {/* Balances */}
        {isConnected && (
          <div
            className="mx-3 mb-4 px-3 py-2.5 bg-[var(--bg-card)]"
            style={{
              border: '2px solid var(--text-primary)',
              boxShadow: '3px 3px 0 var(--text-primary)',
              borderRadius: '3px',
              filter: 'url(#hand-draw)',
            }}
          >
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Cash</span>
              <span className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums">
                {balanceLoading ? '—' : `${cash} USDC`}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Portfolio</span>
              <span className="text-[13px] font-semibold text-[var(--accent-primary)] tabular-nums">
                {balanceLoading ? '—' : `${portfolio} USDC`}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_PRIMARY.map(n => (
            <Link
              key={n.href}
              href={n.href}
              style={isActive(n.href) ? {
                border: '2px solid var(--text-primary)',
                boxShadow: '2px 2px 0 var(--text-primary)',
                borderRadius: '3px',
                filter: 'url(#hand-draw)',
                background: 'var(--accent-primary)',
                color: 'var(--accent-text)',
              } : {
                borderRadius: '3px',
              }}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-[15px] font-semibold transition-all duration-100',
                isActive(n.href)
                  ? ''
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              <n.icon size={15} strokeWidth={2.5} className="shrink-0" />
              <span>{n.label}</span>
            </Link>
          ))}

          <div
            className="pt-3 mt-3"
            style={{ borderTop: '2px solid var(--border-strong)' }}
          >
            {NAV_SECONDARY.map(n => (
              <Link
                key={n.href}
                href={n.href}
                style={isActive(n.href) ? {
                  border: '2px solid var(--text-primary)',
                  boxShadow: '2px 2px 0 var(--text-primary)',
                  borderRadius: '3px',
                  filter: 'url(#hand-draw)',
                  background: 'var(--accent-primary)',
                  color: 'var(--accent-text)',
                } : {
                  borderRadius: '3px',
                }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 text-[15px] font-semibold transition-all duration-100',
                  isActive(n.href)
                    ? ''
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                <n.icon size={15} strokeWidth={2.5} className="shrink-0" />
                <span>{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div
          className="p-3 space-y-2"
          style={{ borderTop: '2px solid var(--text-primary)' }}
        >
          {me?.user?.xUsername && (
            <p className="px-2 text-[12px] text-[var(--text-muted)] truncate">@{me.user.xUsername}</p>
          )}
          <WalletButton />
          <ThemeToggle className="w-full justify-center" />
        </div>
      </aside>

      {/* ── Content area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Mobile top header — ribbon style */}
        <header
          className="md:hidden sticky top-0 z-40 bg-[var(--bg-base)]"
          style={{
            borderTop: '2px solid var(--text-primary)',
            borderBottom: '2px solid var(--text-primary)',
            filter: 'url(#hand-draw-lg)',
          }}
        >
          <div className="flex items-center justify-between h-14 px-5">
            <Link href="/">
              <span
                className="font-display text-[22px] font-bold text-[var(--text-primary)]"
                style={{ textShadow: '2px 2px 0 var(--accent-primary)' }}
              >
                Xen
              </span>
            </Link>

            {isConnected && (
              <div className="flex items-center gap-3 text-[13px]">
                <span className="text-[var(--text-muted)]">Cash </span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {balanceLoading ? '—' : cash}
                </span>
                <span className="text-[var(--border-strong)]">·</span>
                <span className="font-semibold text-[var(--accent-primary)] tabular-nums">
                  {balanceLoading ? '—' : portfolio}
                </span>
              </div>
            )}

            <WalletButton />
          </div>

          {me?.user?.xUsername && (
            <div className="flex items-center gap-3 px-5 pb-2 text-[12px] text-[var(--text-muted)]">
              <span>@{me.user.xUsername}</span>
              <span
                className="h-1.5 w-1.5"
                style={{ borderRadius: '50%', background: 'var(--xen-green)' }}
              />
              <span style={{ color: 'var(--xen-green)' }}>X connected</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 pb-[72px] md:pb-0 bg-[var(--bg-base)]">
          {children}
        </main>

        {/* Mobile bottom nav — ribbon strip */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-base)]"
          style={{
            borderTop: '2px solid var(--text-primary)',
            filter: 'url(#hand-draw-lg)',
          }}
        >
          <div className="flex">
            {NAV_PRIMARY.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors',
                  isActive(n.href)
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)]'
                )}
              >
                <n.icon
                  size={20}
                  strokeWidth={isActive(n.href) ? 2.5 : 2}
                />
                <span className="text-[11px] font-semibold">{n.label}</span>
                {isActive(n.href) && (
                  <span
                    className="h-[2px] w-5 mt-0.5"
                    style={{ background: 'var(--accent-primary)' }}
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
