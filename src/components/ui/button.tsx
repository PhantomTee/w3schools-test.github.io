import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1 focus-visible:ring-offset-[#05070B] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:     'bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-[14px]',
        xen:         'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:from-[#1D4ED8] hover:to-[#2563EB] rounded-[14px]',
        destructive: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#EF4444]/15 rounded-[14px]',
        outline:     'bg-transparent border border-white/[0.10] text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F8FAFC] hover:border-white/[0.16] rounded-[14px]',
        secondary:   'bg-[#151E2E] text-[#94A3B8] hover:bg-[#1c2840] hover:text-[#F8FAFC] rounded-[14px]',
        ghost:       'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04] rounded-[14px]',
        link:        'text-[#3B82F6] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 px-3 text-xs rounded-[10px]',
        lg:      'h-11 px-6 rounded-[16px]',
        xl:      'h-12 px-8 text-base rounded-[16px]',
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
