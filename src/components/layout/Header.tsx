'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap } from 'lucide-react'
import { WalletButton } from '@/components/wallet/WalletButton'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Markets'  },
  { href: '/profile',   label: 'Profile'  },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Xen</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname?.startsWith(n.href)
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  )
}
