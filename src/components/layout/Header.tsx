'use client'
import Link from 'next/link'
import { WalletButton } from '@/components/wallet/WalletButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-soft)] bg-[var(--bg-base)]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-5 max-w-6xl">
        <Link href="/" className="font-display text-[20px] text-[var(--text-primary)] tracking-tight">
          XEN
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/markets"
            className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
          >
            Markets
          </Link>
          <Link
            href="/feed"
            className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
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
