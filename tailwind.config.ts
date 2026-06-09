import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/recharts/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // CSS variable mapped tokens
        'xen-base':      'var(--bg-base)',
        'xen-secondary': 'var(--bg-secondary)',
        'xen-navy':      'var(--bg-navy)',
        'xen-card':      'var(--bg-card)',
        'xen-elevated':  'var(--bg-elevated)',
        'xen-panel':     'var(--bg-panel)',
        'xen-muted-bg':  'var(--bg-muted)',
        'xen-blue':      'var(--blue-primary)',
        'xen-bright':    'var(--blue-bright)',
        'xen-glow':      'var(--blue-glow)',
        'xen-deep':      'var(--blue-deep)',
        'xen-pale':      'var(--blue-pale)',
        'xen-text':      'var(--text-primary)',
        'xen-sub':       'var(--text-secondary)',
        'xen-muted':     'var(--text-muted)',
        'xen-red':       'var(--red)',
        'xen-green':     'var(--green)',
        'xen-amber':     'var(--amber)',

        // Shadcn compat
        border:     'hsl(var(--border, 218 25% 14%))',
        input:      'hsl(var(--input,  218 43% 11%))',
        ring:       'hsl(var(--ring,   221 83% 54%))',
        background: 'hsl(var(--background, 220 38% 4%))',
        foreground: 'hsl(var(--foreground, 210 40% 98%))',
        primary: {
          DEFAULT:    'hsl(var(--primary, 221 83% 54%))',
          foreground: 'hsl(var(--primary-foreground, 0 0% 100%))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary, 218 35% 14%))',
          foreground: 'hsl(var(--secondary-foreground, 215 19% 65%))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive, 0 84% 60%))',
          foreground: 'hsl(var(--destructive-foreground, 0 0% 100%))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted, 218 43% 11%))',
          foreground: 'hsl(var(--muted-foreground, 215 16% 47%))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent, 218 35% 14%))',
          foreground: 'hsl(var(--accent-foreground, 210 40% 98%))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover, 218 43% 10%))',
          foreground: 'hsl(var(--popover-foreground, 210 40% 98%))',
        },
        card: {
          DEFAULT:    'hsl(var(--card, 218 55% 9%))',
          foreground: 'hsl(var(--card-foreground, 210 40% 98%))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'card-stack-enter': {
          '0%':   { opacity: '0', transform: 'scale(0.94) translateY(16px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'card-exit-up': {
          '0%':   { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(-110%) rotate(-4deg)' },
        },
        'number-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        shimmer:           'shimmer 1.6s infinite',
        'fade-in':         'fade-in 0.25s ease-out',
        'sheet-slide-up':  'sheet-slide-up 0.32s cubic-bezier(0.32,0.72,0,1)',
        'card-enter':      'card-stack-enter 0.3s ease-out',
        'card-exit-up':    'card-exit-up 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
        'number-in':       'number-in 0.2s ease-out',
      },
      boxShadow: {
        'card':      '0 2px 8px rgba(0,0,0,0.3)',
        'card-lg':   '0 8px 32px rgba(0,0,0,0.4)',
        'blue-glow': '0 0 40px rgba(59,130,246,0.18)',
        'blue-sm':   '0 0 20px rgba(59,130,246,0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
