import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* Hand-drawn pills — paper fill, ink outline, like the tag ribbons in a sketchbook. */
const inkPill =
  'bg-[var(--paper)] text-[var(--ink)] border-[1.5px] border-[var(--ink)] [box-shadow:1.5px_1.5px_0_var(--ink)]'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[14px] font-normal tracking-wide transition-colors [filter:url(#hand-draw)]',
  {
    variants: {
      variant: {
        // Status — all ink-on-paper; filled = inverted
        open:      inkPill,
        resolved:  'bg-[var(--ink)] text-[var(--paper)] border-[1.5px] border-[var(--ink)] [box-shadow:1.5px_1.5px_0_var(--ink)]',
        voided:    'bg-[var(--paper)] text-[var(--xen-red)] border-[1.5px] border-[var(--xen-red)] [box-shadow:1.5px_1.5px_0_var(--xen-red)]',
        ending:    inkPill,
        cancelled: 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[1.5px] border-[var(--border-soft)]',
        // Neutral
        default:   inkPill,
        neutral:   inkPill,
        // Former colored variants — now ink
        green:     inkPill,
        blue:      inkPill,
        amber:     inkPill,
        red:       'bg-[var(--paper)] text-[var(--xen-red)] border-[1.5px] border-[var(--xen-red)] [box-shadow:1.5px_1.5px_0_var(--xen-red)]',
        purple:    inkPill,
        // Compat
        secondary:   inkPill,
        destructive: 'bg-[var(--paper)] text-[var(--xen-red)] border-[1.5px] border-[var(--xen-red)] [box-shadow:1.5px_1.5px_0_var(--xen-red)]',
        outline:     inkPill,
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
