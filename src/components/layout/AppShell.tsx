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

/* Wobbly drawn border line — a filtered span, so the parent container
   stays filter-free (filters on containers break position:fixed children). */
function SketchLine({ side }: { side: 'top' | 'bottom' | 'right' }) {
  const pos =
    side === 'top'    ? 'top-0 left-0 right-0 h-[2px]'  :
    side === 'bottom' ? 'bottom-0 left-0 right-0 h-[2px]' :
                        'top-0 bottom-0 right-0 w-[2px]'
  return <span aria-hidden className={`absolute ${pos} sketch-line pointer-events-none`} />
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

  const navLinkClass = (active: boolean) => cn(
    'flex items-center gap-2.5 px-3 py-2 text-[18px] rounded-[4px] transition-all duration-100',
    active
      ? 'bg-[var(--ink)] text-[var(--paper)] border-2 border-[var(--ink)] [box-shadow:2px_2px_0_var(--ink)] [filter:url(#hand-draw)]'
      : 'text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-elevated)]'
  )

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="relative hidden md:flex flex-col w-[224px] shrink-0 h-screen sticky top-0 bg-[var(--bg-base)]">
        <SketchLine side="right" />

        {/* Logo */}
        <div className="px-6 pt-7 pb-5">
          <Link href="/">
            <span className="text-[34px] text-[var(--text-primary)] leading-none">Xen</span>
          </Link>
        </div>

        {/* Balances */}
        {isConnected && (
          <div className="mx-3 mb-4 px-3 py-2.5 sketch-panel">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[14px] text-[var(--text-muted)]">Cash</span>
              <span className="text-[16px] text-[var(--text-primary)] tabular-nums">
                {balanceLoading ? '—' : `${cash} USDC`}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[14px] text-[var(--text-muted)]">Portfolio</span>
              <span className="text-[16px] text-[var(--text-primary)] tabular-nums">
                {balanceLoading ? '—' : `${portfolio} USDC`}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {NAV_PRIMARY.map(n => (
            <Link key={n.href} href={n.href} className={navLinkClass(isActive(n.href))}>
              <n.icon size={16} strokeWidth={2.2} className="shrink-0" />
              <span>{n.label}</span>
            </Link>
          ))}

          <div className="relative pt-3 mt-3">
            <SketchLine side="top" />
            {NAV_SECONDARY.map(n => (
              <Link key={n.href} href={n.href} className={navLinkClass(isActive(n.href))}>
                <n.icon size={16} strokeWidth={2.2} className="shrink-0" />
                <span>{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="relative p-3 space-y-2">
          <SketchLine side="top" />
          {me?.user?.xUsername && (
            <p className="px-2 text-[14px] text-[var(--text-muted)] truncate">@{me.user.xUsername}</p>
          )}
          <WalletButton />
          <ThemeToggle className="w-full justify-center rounded-[4px]" />
        </div>
      </aside>

      {/* ── Content area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Mobile top header */}
        <header className="relative md:hidden sticky top-0 z-40 bg-[var(--bg-base)]">
          <SketchLine side="bottom" />
          <div className="flex items-center justify-between h-14 px-5">
            <Link href="/">
              <span className="text-[28px] text-[var(--text-primary)] leading-none">Xen</span>
            </Link>

            {isConnected && (
              <div className="flex items-center gap-2 text-[15px]">
                <span className="text-[var(--text-muted)]">Cash</span>
                <span className="text-[var(--text-primary)] tabular-nums">
                  {balanceLoading ? '—' : cash}
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-primary)] tabular-nums">
                  {balanceLoading ? '—' : portfolio}
                </span>
              </div>
            )}

            <WalletButton />
          </div>

          {me?.user?.xUsername && (
            <div className="flex items-center gap-2 px-5 pb-2 text-[14px] text-[var(--text-muted)]">
              <span>@{me.user.xUsername}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]" />
              <span>X connected</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 pb-[72px] md:pb-0 bg-[var(--bg-base)]">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="relative md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-base)]">
          <SketchLine side="top" />
          <div className="flex">
            {NAV_PRIMARY.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors',
                  isActive(n.href) ? 'text-[var(--ink)]' : 'text-[var(--text-muted)]'
                )}
              >
                <n.icon size={20} strokeWidth={isActive(n.href) ? 2.5 : 2} />
                <span className="text-[13px]">{n.label}</span>
                {isActive(n.href) && (
                  <span className="h-[2px] w-5 mt-0.5 sketch-line" />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
