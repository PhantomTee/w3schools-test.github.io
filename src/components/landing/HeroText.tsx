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
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % LINES.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const [line1, line2] = LINES[idx]

  return (
    <h1
      className="font-display text-[clamp(52px,10vw,120px)] leading-[0.92] tracking-[-0.02em] uppercase mb-8 max-w-[900px]"
      style={{ transition: 'opacity 0.3s ease', opacity: visible ? 1 : 0 }}
    >
      {line1}<br />{line2}
    </h1>
  )
}
