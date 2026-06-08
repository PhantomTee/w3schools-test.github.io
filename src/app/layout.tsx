import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Xen — Tweet Attention Markets on Arc',
  description:
    'Turn fresh tweets into USDC-settled attention markets. Verify X. Create markets. Trade ranges. Settle on Arc.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title:       'Xen — Tweet Attention Markets',
    description: 'Turn fresh tweets into USDC-settled attention markets on Arc.',
    type:        'website',
  },
  twitter: {
    card:    'summary_large_image',
    title:   'Xen',
    description: 'Turn fresh tweets into USDC-settled attention markets on Arc.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
