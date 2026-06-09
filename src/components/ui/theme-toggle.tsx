'use client'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]',
        'text-[12px] font-medium',
        'border border-[var(--border-strong)]',
        'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
        'transition-colors',
        className
      )}
    >
      <span className={cn('transition-colors', !isDark ? 'text-[var(--accent-primary)] font-semibold' : '')}>
        Light
      </span>
      <span className="text-[var(--border-strong)]">/</span>
      <span className={cn('transition-colors', isDark ? 'text-[var(--accent-primary)] font-semibold' : '')}>
        Dark
      </span>
    </button>
  )
}
