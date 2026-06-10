'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
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
      aria-label="Toggle theme"
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-[var(--sketch-r)]',
        'border border-[var(--border-strong)]',
        'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
        'transition-colors',
        className
      )}
    >
      {isDark
        ? <Sun  size={16} strokeWidth={2.5} />
        : <Moon size={16} strokeWidth={2.5} />
      }
    </button>
  )
}
