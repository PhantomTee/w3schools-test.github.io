'use client'
import Link from 'next/link'
import { WalletButton } from '@/components/wallet/WalletButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 w-full bg-[var(--bg-base)]"
      style={{
        borderTop: '2px solid var(--text-primary)',
        borderBottom: '2px solid var(--text-primary)',
        filter: 'url(#hand-draw-lg)',
      }}
    >
      <div className="mx-auto flex h-14 items-center justify-between px-5 max-w-6xl">
        <Link href="/">
          <span
            className="font-display text-[22px] font-bold text-[var(--text-primary)]"
            style={{ textShadow: '2px 2px 0 var(--accent-primary)' }}
          >
            XEN
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/markets"
            className="text-[15px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
          >
            Markets
          </Link>
          <Link
            href="/feed"
            className="text-[15px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
          >
            Feed
          </Link>
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
