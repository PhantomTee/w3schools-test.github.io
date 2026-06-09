'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  title?: string
}

export function BottomSheet({ open, onClose, children, className, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on backdrop click
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'relative z-10 rounded-t-[28px] bg-[var(--bg-card)] border-t border-[var(--border-soft)] animate-sheet-slide-up',
          'max-h-[92vh] overflow-y-auto',
          className
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border-soft)]" />
        </div>

        {title && (
          <div className="px-5 pb-3 pt-1 border-b border-[var(--border-soft)]">
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
        )}

        <div className="pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
