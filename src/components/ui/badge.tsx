import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        // Status
        open:      'bg-[#22C55E]/10 text-[#22C55E] dark:bg-[#22C55E]/10 dark:text-[#22C55E]',
        resolved:  'bg-[#3B82F6]/10 text-[#3B82F6]',
        voided:    'bg-[#EF4444]/10 text-[#EF4444] dark:bg-[#EF4444]/10 dark:text-[#EF4444]',
        ending:    'bg-[#F59E0B]/10 text-[#F59E0B] dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]',
        cancelled: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
        // Neutral
        default:   'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-soft)]',
        neutral:   'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-soft)]',
        // Colored
        blue:      'bg-[#3B82F6]/10 text-[#3B82F6]',
        green:     'bg-[#22C55E]/10 text-[#22C55E] dark:bg-[#22C55E]/10 dark:text-[#22C55E]',
        amber:     'bg-[#F59E0B]/10 text-[#F59E0B]',
        red:       'bg-[#EF4444]/10 text-[#EF4444] dark:bg-[#EF4444]/10 dark:text-[#EF4444]',
        // Compat
        secondary:   'bg-[var(--bg-muted)] text-[var(--text-muted)]',
        destructive: 'bg-[#EF4444]/10 text-[#EF4444]',
        outline:     'border border-[var(--border-soft)] text-[var(--text-secondary)]',
        purple:      'bg-[#8B5CF6]/10 text-[#8B5CF6]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
