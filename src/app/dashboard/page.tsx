'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MarketCard } from '@/components/markets/MarketCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Flame, Clock, CheckCircle2 } from 'lucide-react'

type Filter = 'live' | 'ending' | 'resolved' | 'all'

export default function DashboardPage() {
  const [filter, setFilter]   = useState<Filter>('live')
  const [metric, setMetric]   = useState<string>('')
  const [search, setSearch]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey:  ['markets', filter, metric],
    queryFn:   () => fetch(`/api/markets?filter=${filter}${metric ? `&metric=${metric}` : ''}`).then(r => r.json()),
    refetchInterval: 30_000,
  })

  const markets = (data?.markets ?? []).filter((m: any) =>
    !search ||
    m.tweetId.includes(search) ||
    m.xUsername?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Markets</h1>
            <p className="text-sm text-muted-foreground">USDC range prediction markets on tweet attention</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creator / tweet…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All metrics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All metrics</SelectItem>
                <SelectItem value="FINAL_VIEWS">Views</SelectItem>
                <SelectItem value="FINAL_LIKES">Likes</SelectItem>
                <SelectItem value="FINAL_REPOSTS">Reposts</SelectItem>
                <SelectItem value="FINAL_REPLIES">Replies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
          <TabsList className="mb-6">
            <TabsTrigger value="live" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Live
            </TabsTrigger>
            <TabsTrigger value="ending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Ending soon
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {(['live', 'ending', 'resolved', 'all'] as Filter[]).map(tab => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-64 rounded-xl bg-card animate-pulse" />
                  ))}
                </div>
              ) : markets.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No {filter === 'live' ? 'live' : filter} markets yet.</p>
                  {filter === 'live' && (
                    <a href="/profile" className="text-primary hover:underline text-sm mt-2 block">
                      Create the first market →
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {markets.map((m: any) => <MarketCard key={m.id} market={m} />)}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
