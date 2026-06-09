import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        // Primary — emerald gradient
        primary:
          'bg-gradient-to-r from-[#059669] to-[#10B981] text-white hover:from-[#047857] hover:to-[#059669] active:scale-[0.98] rounded-[8px]',
        xen:
          'bg-gradient-to-r from-[#059669] to-[#10B981] text-white hover:from-[#047857] hover:to-[#059669] active:scale-[0.98] rounded-[8px]',
        default:
          'bg-gradient-to-r from-[#059669] to-[#10B981] text-white hover:from-[#047857] hover:to-[#059669] active:scale-[0.98] rounded-[8px]',
        // Secondary — dark glass
        secondary:
          'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-soft)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-[0.98] rounded-[8px]',
        outline:
          'bg-transparent border border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-[0.98] rounded-[8px]',
        // Ghost
        ghost:
          'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-[8px]',
        // Destructive
        destructive:
          'bg-[var(--xen-red)]/10 text-[var(--xen-red)] border border-[var(--xen-red)]/20 hover:bg-[var(--xen-red)]/15 rounded-[8px]',
        // Link
        link:
          'text-[#10B981] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-5 py-2 text-[14px]',
        sm:      'h-8 px-3 text-[12px] rounded-[6px]',
        md:      'h-10 px-5 text-[14px]',
        lg:      'h-12 px-6 text-[15px] rounded-[10px]',
        xl:      'h-14 px-8 text-[16px] rounded-[10px]',
        '2xl':   'h-16 px-10 text-[18px] rounded-[12px]',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
