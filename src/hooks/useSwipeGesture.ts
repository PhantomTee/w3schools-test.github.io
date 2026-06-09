import { useCallback, useRef } from 'react'

interface SwipeGestureOptions {
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useSwipeGesture({
  onSwipeUp,
  onSwipeDown,
  threshold = 80,
}: SwipeGestureOptions) {
  const startY    = useRef(0)
  const startTime = useRef(0)
  const dragging  = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current    = e.touches[0].clientY
    startTime.current = Date.now()
    dragging.current  = true
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return
    dragging.current = false

    const deltaY    = startY.current - e.changedTouches[0].clientY
    const elapsed   = Date.now() - startTime.current
    const velocity  = Math.abs(deltaY) / elapsed // px/ms

    // Trigger on threshold distance OR fast flick (velocity > 0.5 px/ms)
    if (deltaY > threshold || (deltaY > 40 && velocity > 0.5)) {
      onSwipeUp?.()
    } else if (-deltaY > threshold || (-deltaY > 40 && velocity > 0.5)) {
      onSwipeDown?.()
    }
  }, [onSwipeUp, onSwipeDown, threshold])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY > 40) onSwipeUp?.()
    else if (e.deltaY < -40) onSwipeDown?.()
  }, [onSwipeUp, onSwipeDown])

  return { handleTouchStart, handleTouchEnd, handleWheel }
}
