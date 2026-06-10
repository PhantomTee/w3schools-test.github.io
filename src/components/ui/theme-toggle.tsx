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
        'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
        'bg-[var(--paper)] text-[var(--ink)] border-2 border-[var(--ink)]',
        '[box-shadow:2px_2px_0_var(--ink)] hover:[box-shadow:3px_3px_0_var(--ink)]',
        'active:translate-x-[1px] active:translate-y-[1px] active:[box-shadow:1px_1px_0_var(--ink)]',
        '[filter:url(#hand-draw)] transition-all duration-100',
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
