import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        // Status
        open:      'bg-[#10B981]/10 text-[#10B981]',
        resolved:  'bg-[#34D399]/10 text-[#34D399]',
        voided:    'bg-[#F87171]/10 text-[#F87171]',
        ending:    'bg-[#FBBF24]/10 text-[#FBBF24]',
        cancelled: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
        // Neutral
        default:   'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-soft)]',
        neutral:   'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-soft)]',
        // Colored
        green:     'bg-[#10B981]/10 text-[#10B981]',
        blue:      'bg-[#60A5FA]/10 text-[#60A5FA]',
        amber:     'bg-[#FBBF24]/10 text-[#FBBF24]',
        red:       'bg-[#F87171]/10 text-[#F87171]',
        purple:    'bg-[#A78BFA]/10 text-[#A78BFA]',
        // Compat
        secondary:   'bg-[var(--bg-muted)] text-[var(--text-muted)]',
        destructive: 'bg-[#F87171]/10 text-[#F87171]',
        outline:     'border border-[var(--border-soft)] text-[var(--text-secondary)]',
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
