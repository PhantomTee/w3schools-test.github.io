import type { Metadata } from 'next'
import { Syne, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const syne = Syne({
  subsets:  ['latin'],
  variable: '--font-display',
  weight:   ['400', '600', '700', '800'],
  display:  'swap',
})

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-sans',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${inter.variable} font-sans min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
