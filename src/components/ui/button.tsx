import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* Hand-drawn buttons — paper fill, ink outline, offset ink shadow,
   wobbled by the #hand-draw SVG displacement filter. */
const sketch =
  'bg-[var(--paper)] text-[var(--ink)] border-2 border-[var(--ink)] ' +
  '[box-shadow:3px_3px_0_var(--ink)] hover:[box-shadow:4px_4px_0_var(--ink)] ' +
  'active:[box-shadow:1px_1px_0_var(--ink)]'

const sketchFilled =
  'bg-[var(--ink)] text-[var(--paper)] border-2 border-[var(--ink)] ' +
  '[box-shadow:3px_3px_0_var(--ink)] hover:[box-shadow:4px_4px_0_var(--ink)] ' +
  'active:[box-shadow:1px_1px_0_var(--ink)]'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap font-normal',
    'transition-all duration-100 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
    '[filter:url(#hand-draw)]',
    'active:translate-x-[2px] active:translate-y-[2px]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:   sketch,
        xen:       sketch,
        primary:   sketch,
        secondary: sketch,
        outline:   sketch,
        filled:    sketchFilled,
        ghost:
          'bg-transparent text-[var(--text-muted)] border-2 border-transparent hover:border-[var(--ink)] hover:text-[var(--ink)]',
        destructive:
          'bg-[var(--paper)] text-[var(--xen-red)] border-2 border-[var(--xen-red)] [box-shadow:3px_3px_0_var(--xen-red)] hover:[box-shadow:4px_4px_0_var(--xen-red)] active:[box-shadow:1px_1px_0_var(--xen-red)]',
        link:
          'bg-transparent text-[var(--ink)] underline-offset-4 hover:underline p-0 h-auto border-0 shadow-none [filter:none]',
      },
      size: {
        default: 'h-10 px-5 py-2 text-[18px] rounded-[4px]',
        sm:      'h-8  px-3 text-[16px] rounded-[4px]',
        md:      'h-10 px-5 text-[18px] rounded-[4px]',
        lg:      'h-12 px-6 text-[20px] rounded-[4px]',
        xl:      'h-14 px-8 text-[22px] rounded-[4px]',
        '2xl':   'h-16 px-10 text-[24px] rounded-[4px]',
        icon:    'h-9 w-9 rounded-[4px]',
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
