import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-[#151E2E] text-[#94A3B8]',
        outline:     'border border-white/[0.10] text-[#94A3B8]',
        green:       'bg-[#22C55E]/10 text-[#22C55E]',
        amber:       'bg-[#F59E0B]/10 text-[#F59E0B]',
        blue:        'bg-[#3B82F6]/10 text-[#3B82F6]',
        red:         'bg-[#EF4444]/10 text-[#EF4444]',
        purple:      'bg-[#8B5CF6]/10 text-[#8B5CF6]',
        secondary:   'bg-[#151E2E] text-[#64748B]',
        destructive: 'bg-[#EF4444]/10 text-[#EF4444]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
