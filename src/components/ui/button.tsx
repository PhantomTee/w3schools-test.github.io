import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        // Primary — blue gradient
        primary:
          'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:from-[#1D4ED8] hover:to-[#2563EB] active:scale-[0.98] rounded-[14px]',
        // Alias for primary
        xen:
          'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:from-[#1D4ED8] hover:to-[#2563EB] active:scale-[0.98] rounded-[14px]',
        default:
          'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:from-[#1D4ED8] hover:to-[#2563EB] active:scale-[0.98] rounded-[14px]',
        // Secondary — dark glass
        secondary:
          'bg-[var(--bg-elevated)] dark:bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-soft)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.10)] active:scale-[0.98] rounded-[14px]',
        outline:
          'bg-transparent border border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.12)] active:scale-[0.98] rounded-[14px]',
        // Ghost
        ghost:
          'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-[14px]',
        // Destructive
        destructive:
          'bg-[var(--xen-red)]/10 text-[var(--xen-red)] border border-[var(--xen-red)]/20 hover:bg-[var(--xen-red)]/15 rounded-[14px]',
        // Link
        link:
          'text-[#3B82F6] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-5 py-2 text-[14px]',
        sm:      'h-8 px-3 text-[12px] rounded-[10px]',
        md:      'h-10 px-5 text-[14px]',
        lg:      'h-12 px-6 text-[15px] rounded-[16px]',
        xl:      'h-14 px-8 text-[16px] rounded-[16px]',
        '2xl':   'h-16 px-10 text-[18px] rounded-[18px]',
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
