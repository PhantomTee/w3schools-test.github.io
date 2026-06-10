'use client'
import { useState, useEffect } from 'react'

const LINES = [
  ['Predict tweet', 'metrics.'],
  ['Stake on where', 'the timeline lands.'],
  ['Every tweet', 'is a market.'],
  ['Your call.', 'Your pool.'],
  ['Win USDC', 'from the feed.'],
]

export function HeroText() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx(i => (i + 1) % LINES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  /* All phrases are rendered stacked in the same grid cell — the tallest one
     sets the height, so rotation never shifts the layout below. */
  return (
    <h1 className="grid text-[clamp(56px,10vw,120px)] leading-[0.95] mb-8 max-w-[900px]">
      {LINES.map(([a, b], i) => (
        <span
          key={i}
          aria-hidden={i !== idx}
          className="col-start-1 row-start-1 transition-opacity duration-300"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          {a}<br />{b}
        </span>
      ))}
    </h1>
  )
}
