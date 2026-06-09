'use client'
import Link from 'next/link'
import { WalletButton } from '@/components/wallet/WalletButton'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-[#05070B]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-5 max-w-6xl">
        <Link href="/" className="text-[18px] font-semibold tracking-tight text-white">
          Xen
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/markets"
            className="text-[14px] font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors hidden sm:block"
          >
            View Markets
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
