'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from '@/components/wallet/WalletButton'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/markets',   label: 'Markets'   },
  { href: '/profile',   label: 'Profile'   },
  { href: '/claims',    label: 'Claims'    },
  { href: '/activity',  label: 'Activity'  },
  { href: '/settings',  label: 'Settings'  },
]

const BOTTOM_NAV = NAV.filter(n => n.href !== '/settings')

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href) ?? false
  }

  return (
    <div className="min-h-screen flex bg-[#05070B]">
      {/* Desktop left sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 border-r border-white/[0.05] bg-[#05070B]">
        <div className="px-6 pt-7 pb-5">
          <Link href="/" className="block">
            <span className="text-[20px] font-semibold tracking-tight text-white">Xen</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-px overflow-y-auto">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'block px-3 py-2.5 rounded-[12px] text-[14px] font-medium transition-all duration-150',
                isActive(n.href)
                  ? 'bg-[#2563EB]/[0.14] text-white'
                  : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04]'
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.05]">
          <WalletButton />
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-5 border-b border-white/[0.05] bg-[#05070B]/90 backdrop-blur-md">
          <Link href="/" className="text-[18px] font-semibold tracking-tight text-white">Xen</Link>
          <WalletButton />
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0 bg-page">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/[0.05] bg-[#05070B]/95 backdrop-blur-md">
          {BOTTOM_NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex-1 flex items-center justify-center py-3.5 text-[11px] font-medium tracking-wide transition-colors',
                isActive(n.href) ? 'text-[#3B82F6]' : 'text-[#64748B]'
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
