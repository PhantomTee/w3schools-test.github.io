'use client'
import { useState, useCallback, useRef } from 'react'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { MarketSwipeCard } from './MarketSwipeCard'
import { cn } from '@/lib/utils'
import type { MarketWithPools } from '@/types/market'

interface SwipeFeedProps {
  markets: MarketWithPools[]
}

export function SwipeFeed({ markets }: SwipeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exiting,      setExiting]      = useState(false)
  const throttle                         = useRef(false)

  const advance = useCallback(() => {
    if (exiting || throttle.current || currentIndex >= markets.length - 1) return
    throttle.current = true
    setExiting(true)

    setTimeout(() => {
      setCurrentIndex(i => i + 1)
      setExiting(false)
      throttle.current = false
    }, 340)
  }, [currentIndex, markets.length, exiting])

  const { handleTouchStart, handleTouchEnd, handleWheel } = useSwipeGesture({
    onSwipeUp: advance,
    threshold: 80,
  })

  if (!markets.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
        <p className="text-[17px] font-medium text-[var(--text-primary)] mb-2">No live markets found.</p>
        <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
          Create a market from a fresh tweet or adjust your filters.
        </p>
      </div>
    )
  }

  const visible = markets.slice(currentIndex, currentIndex + 3)

  return (
    <div
      className="relative w-full"
      style={{ height: 'calc(100dvh - 200px)', minHeight: 400 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {visible.map((market, i) => {
        const isTop  = i === 0
        const scale  = isTop ? 1 : 1 - i * 0.035
        const offset = isTop ? 0 : -(i * 14)   // peek: each card sits 14px above the one in front
        const opacity = isTop ? 1 : Math.max(0.35, 1 - i * 0.3)
        const zIndex  = visible.length - i

        return (
          <MarketSwipeCard
            key={market.id}
            market={market}
            isActive={isTop}
            isPeeking={!isTop}
            className={cn(
              isTop && exiting ? 'animate-card-exit' : '',
              !isTop ? 'transition-transform duration-300' : ''
            )}
            style={{
              transform:       `scale(${scale}) translateY(${offset}px)`,
              opacity,
              zIndex,
              transformOrigin: 'bottom center',
            }}
          />
        )
      })}

      {currentIndex < markets.length - 1 && (
        <div className="absolute bottom-[-32px] left-0 right-0 flex justify-center">
          <p className="text-[11px] text-[var(--text-muted)] tracking-wide">Swipe up to skip</p>
        </div>
      )}

      {/* Progress dots */}
      <div className="absolute bottom-[-52px] left-0 right-0 flex justify-center gap-1.5">
        {markets.slice(0, Math.min(markets.length, 8)).map((_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-full transition-all duration-200',
              i === currentIndex
                ? 'w-4 h-1.5 bg-[var(--accent-bright)]'
                : i < currentIndex
                  ? 'w-1.5 h-1.5 bg-[var(--text-muted)]/30'
                  : 'w-1.5 h-1.5 bg-[var(--text-muted)]/50'
            )}
          />
        ))}
      </div>
    </div>
  )
}
