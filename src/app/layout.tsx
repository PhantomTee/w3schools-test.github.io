import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const urbanist = Urbanist({
  subsets:  ['latin'],
  variable: '--font-sans',
  weight:   ['400', '500', '600', '700'],
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'Xen — Tweet Attention Markets on Arc',
  description: 'Turn fresh tweets into USDC-settled attention markets. Verify X. Create markets. Trade ranges. Settle on Arc.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title:       'Xen — Tweet Attention Markets',
    description: 'Turn fresh tweets into USDC-settled attention markets on Arc.',
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Xen',
    description: 'Turn fresh tweets into USDC-settled attention markets on Arc.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${urbanist.variable} font-sans min-h-screen bg-[#05070B] text-[#F8FAFC]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
