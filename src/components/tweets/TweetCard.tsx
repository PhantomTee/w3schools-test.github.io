'use client'
import Link from 'next/link'
import { Eye, Heart, Repeat2, MessageCircle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCount, formatAge } from '@/lib/utils'
import type { EligibleTweet } from '@/types/tweet'

interface Props {
  tweet:  EligibleTweet
  showCreateButton?: boolean
}

export function TweetCard({ tweet, showCreateButton = true }: Props) {
  const m = tweet.normalizedMetrics

  return (
    <Card className={`transition-all ${tweet.eligible ? 'gradient-border hover:glow-purple' : 'opacity-60'}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed line-clamp-3 flex-1">{tweet.text}</p>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {tweet.eligible ? (
              <Badge variant="green" className="text-xs">Eligible</Badge>
            ) : (
              <Badge variant="red" className="text-xs">Not eligible</Badge>
            )}
            {tweet.activeMarketCount > 0 && (
              <Badge variant="purple" className="text-xs">
                {tweet.activeMarketCount} market{tweet.activeMarketCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {m.views != null ? (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatCount(m.views)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500">
              <Eye className="h-3.5 w-3.5" /> no views data
            </span>
          )}
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {formatCount(m.likes)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-3.5 w-3.5" /> {formatCount(m.reposts)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {formatCount(m.replies)}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3.5 w-3.5" /> {formatAge(tweet.created_at)}
          </span>
        </div>

        {/* Eligibility note */}
        {!tweet.eligible && tweet.eligibilityNote && (
          <p className="text-xs text-muted-foreground italic">{tweet.eligibilityNote}</p>
        )}

        {/* Actions */}
        {showCreateButton && tweet.eligible && tweet.activeMarketCount < 3 && (
          <Link href={`/create/${tweet.id}`}>
            <Button size="sm" variant="xen" className="w-full gap-2 mt-1">
              <TrendingUp className="h-4 w-4" />
              Create Market
            </Button>
          </Link>
        )}
        {showCreateButton && tweet.eligible && tweet.activeMarketCount >= 3 && (
          <p className="text-xs text-center text-muted-foreground">Max 3 markets per tweet reached</p>
        )}
        {showCreateButton && tweet.activeMarketCount > 0 && (
          <div className="flex justify-center">
            <Link href={`/dashboard?tweet=${tweet.id}`} className="text-xs text-primary hover:underline">
              View existing markets →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
