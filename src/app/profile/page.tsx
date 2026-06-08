'use client'
import { Suspense, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TweetCard } from '@/components/tweets/TweetCard'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wallet, Twitter, AlertCircle, RefreshCw, CheckCircle2
} from 'lucide-react'
import { shortenAddress } from '@/lib/utils'

// Isolated component so useSearchParams is inside a Suspense boundary
function ProfileNotifications() {
  const searchParams = useSearchParams()
  const connected    = searchParams.get('connected')
  const error        = searchParams.get('error')
  const qc           = useQueryClient()

  useEffect(() => {
    if (connected) qc.invalidateQueries({ queryKey: ['me'] })
  }, [connected, qc])

  if (!connected && !error) return null

  return (
    <>
      {connected && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/30 text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4" /> X account connected successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error === 'x_denied'            ? 'X authorization was denied.' :
           error === 'x_already_connected' ? 'This X account is already connected to another wallet.' :
           `Error: ${error}`}
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/auth/me').then(r => r.json()),
  })
  const me = meData?.user

  const { data: tweetsData, isLoading: tweetsLoading, refetch } = useQuery({
    queryKey:  ['my-tweets'],
    queryFn:   () => fetch('/api/tweets').then(r => r.json()),
    enabled:   !!me?.xUserId,
    staleTime: 60_000,
  })

  if (!me) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Connect your wallet</h1>
          <p className="text-muted-foreground">Sign in with your wallet to view your profile and create markets.</p>
        </main>
        <Footer />
      </div>
    )
  }

  const tweets = tweetsData?.tweets ?? []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* Search-params notifications — must be inside Suspense */}
        <Suspense fallback={null}>
          <ProfileNotifications />
        </Suspense>

        {/* Profile card */}
        <Card className="gradient-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{shortenAddress(me.walletAddress)}</span>
                  <Badge variant="green" className="text-xs">Connected</Badge>
                </div>
                {me.xUsername ? (
                  <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">@{me.xUsername}</span>
                    <Badge variant="blue" className="text-xs">X verified</Badge>
                    <span className="text-xs text-muted-foreground">
                      since {new Date(me.xConnectedAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Twitter className="h-4 w-4" /> X not connected
                    </div>
                    <a href="/api/auth/x/connect">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Twitter className="h-3.5 w-3.5" /> Connect X
                      </Button>
                    </a>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {me.marketsCreatedToday}
                  <span className="text-sm font-normal text-muted-foreground">/10</span>
                </div>
                <div className="text-xs text-muted-foreground">markets today</div>
                <div className="text-xs text-muted-foreground mt-1">{me.totalMarketsCreated} total created</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tweets section */}
        {me.xUserId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Recent tweets</h2>
                <p className="text-sm text-muted-foreground">
                  Only tweets posted after X connection are shown. Eligible tweets (≤ 3h old) can become markets.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            {tweetsData?.error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" /> {tweetsData.error}
              </div>
            )}

            {tweetsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-card animate-pulse" />
                ))}
              </div>
            ) : tweets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center space-y-2">
                  <p className="text-muted-foreground">No tweets found since your X connection.</p>
                  <p className="text-sm text-muted-foreground">Post a tweet and come back within 3 hours to create a market.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tweets.map((t: any) => (
                  <TweetCard key={t.id} tweet={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
