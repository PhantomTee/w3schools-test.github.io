'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCount, formatAge } from '@/lib/utils'
import type { EligibleTweet } from '@/types/tweet'

interface Props {
  tweet:             EligibleTweet
  showCreateButton?: boolean
}

export function TweetCard({ tweet, showCreateButton = true }: Props) {
  const m = tweet.normalizedMetrics

  return (
    <div
      className={`rounded-[24px] border p-5 transition-all ${
        tweet.eligible
          ? 'bg-[#0B1220] border-[rgba(59,130,246,0.18)] hover:border-[rgba(59,130,246,0.32)]'
          : 'bg-[#080D14] border-white/[0.04] opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-[14px] leading-relaxed text-[#F8FAFC] line-clamp-3 flex-1">{tweet.text}</p>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {tweet.eligible ? (
            <Badge variant="green">Eligible</Badge>
          ) : (
            <Badge variant="default">Ineligible</Badge>
          )}
          {tweet.activeMarketCount > 0 && (
            <Badge variant="blue">{tweet.activeMarketCount} market{tweet.activeMarketCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 py-3 mb-3 border-y border-white/[0.05]">
        {[
          { label: 'Views',   value: m.views != null ? formatCount(m.views) : 'N/A' },
          { label: 'Likes',   value: formatCount(m.likes) },
          { label: 'Reposts', value: formatCount(m.reposts) },
          { label: 'Replies', value: formatCount(m.replies) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">{value}</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 text-[13px]">
        <span className="text-[#64748B]">Posted {formatAge(tweet.created_at)} ago</span>
        {tweet.eligible && (
          <span className="text-[var(--ink)]">Creation window open</span>
        )}
      </div>

      {!tweet.eligible && tweet.eligibilityNote && (
        <p className="text-[13px] text-[#64748B] mb-3">{tweet.eligibilityNote}</p>
      )}

      {showCreateButton && tweet.eligible && tweet.activeMarketCount < 3 && (
        <Link href={`/create/${tweet.id}`}>
          <Button variant="xen" size="sm" className="w-full">Create Market</Button>
        </Link>
      )}
      {showCreateButton && tweet.eligible && tweet.activeMarketCount >= 3 && (
        <p className="text-[12px] text-center text-[#64748B]">Maximum 3 markets per tweet reached</p>
      )}
      {showCreateButton && tweet.activeMarketCount > 0 && tweet.eligible && (
        <div className="mt-2 text-center">
          <Link href={`/dashboard?tweet=${tweet.id}`} className="text-[12px] text-[var(--ink)] hover:text-[var(--text-secondary)] transition-colors">
            View existing markets
          </Link>
        </div>
      )}
    </div>
  )
}
