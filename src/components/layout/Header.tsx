'use client'
import Link from 'next/link'
import { WalletButton } from '@/components/wallet/WalletButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  return (
    <header className="relative sticky top-0 z-40 w-full bg-[var(--bg-base)]">
      {/* Drawn border lines — filtered spans so the header itself stays
          filter-free (a filtered container would trap the wallet modal). */}
      <span aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px] sketch-line pointer-events-none" />

      <div className="mx-auto flex h-14 items-center justify-between px-5 max-w-6xl">
        <Link href="/">
          <span className="text-[30px] text-[var(--text-primary)] leading-none">XEN</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/markets"
            className="text-[18px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block underline-offset-4 hover:underline"
          >
            Markets
          </Link>
          <Link
            href="/feed"
            className="text-[18px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block underline-offset-4 hover:underline"
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
