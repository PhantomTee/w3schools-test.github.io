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
        'text-[12px] font-medium text-[var(--text-muted)]',
        'border border-[var(--border-soft)]',
        'hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
        'transition-colors',
        className
      )}
    >
      <span className={cn('transition-colors', isDark ? 'text-[var(--text-muted)]' : 'text-[var(--accent-primary)]')}>
        Light
      </span>
      <span className="text-[var(--border-soft)]">/</span>
      <span className={cn('transition-colors', isDark ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]')}>
        Dark
      </span>
    </button>
  )
}
