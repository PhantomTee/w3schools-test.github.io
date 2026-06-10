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
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 border-r border-[var(--border-soft)] bg-[var(--bg-base)]">
        <div className="px-6 pt-7 pb-5 flex items-center justify-between">
          <Link href="/">
            <span className="font-display text-[20px] font-bold tracking-tight text-[var(--text-primary)]">Xen</span>
          </Link>
        </div>

        {/* Balances (desktop sidebar) */}
        {isConnected && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--border-soft)]">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Cash</span>
              <span className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums">
                {balanceLoading ? '—' : `${cash} USDC`}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Portfolio</span>
              <span className="text-[13px] font-semibold text-[var(--accent-primary)] tabular-nums">
                {balanceLoading ? '—' : `${portfolio} USDC`}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-px overflow-y-auto">
          {NAV_PRIMARY.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-[14px] font-medium transition-all duration-150',
                isActive(n.href)
                  ? 'bg-[var(--accent-primary)]/[0.10] text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              <n.icon size={15} strokeWidth={2.2} className="shrink-0" />
              <span>{n.label}</span>
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-[var(--border-soft)]">
            {NAV_SECONDARY.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-[14px] font-medium transition-all duration-150',
                  isActive(n.href)
                    ? 'bg-[var(--accent-primary)]/[0.10] text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                <n.icon size={15} strokeWidth={2.2} className="shrink-0" />
                <span>{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-[var(--border-soft)] space-y-2">
          {me?.user?.xUsername && (
            <p className="px-2 text-[11px] text-[var(--text-muted)] truncate">@{me.user.xUsername}</p>
          )}
          <WalletButton />
          <ThemeToggle className="w-full justify-center" />
        </div>
      </aside>

      {/* ── Content area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Mobile top header */}
        <header className="md:hidden sticky top-0 z-40 border-b border-[var(--border-soft)] bg-[var(--bg-base)]/95 backdrop-blur-md">
          <div className="flex items-center justify-between h-14 px-5">
            <Link href="/">
              <span className="font-display text-[18px] font-bold tracking-tight text-[var(--text-primary)]">Xen</span>
            </Link>

            {/* Cash + portfolio balance (mobile header center) */}
            {isConnected && (
              <div className="flex items-center gap-3 text-[12px]">
                <div className="text-center">
                  <span className="text-[var(--text-muted)]">Cash </span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {balanceLoading ? '—' : `${cash}`}
                  </span>
                </div>
                <span className="text-[var(--border-soft)]">·</span>
                <div className="text-center">
                  <span className="text-[var(--text-muted)]">Portfolio </span>
                  <span className="font-semibold text-[var(--accent-primary)] tabular-nums">
                    {balanceLoading ? '—' : `${portfolio}`}
                  </span>
                </div>
              </div>
            )}

            <WalletButton />
          </div>

          {/* X status row */}
          {me?.user?.xUsername && (
            <div className="flex items-center gap-3 px-5 pb-2 text-[11px] text-[var(--text-muted)]">
              <span>@{me.user.xUsername}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--xen-green)]" />
              <span className="text-[var(--xen-green)]">X connected</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 pb-[72px] md:pb-0 bg-[var(--bg-base)]">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-soft)] bg-[var(--bg-base)]/95 backdrop-blur-md">
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
                <n.icon size={20} strokeWidth={2} />
                <span className="text-[11px] font-medium tracking-wide">{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
