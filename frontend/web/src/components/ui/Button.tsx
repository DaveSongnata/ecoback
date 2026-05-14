import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/* ── Types ──────────────────────────────────────────────── */

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

/* ── Style maps ─────────────────────────────────────────── */

const variantStyles: Record<Variant, string> = {
  primary: cn(
    'bg-gradient-to-b from-primary-light to-primary-base text-white',
    'shadow-lg shadow-primary-dark/20',
    'hover:brightness-105 hover:-translate-y-px',
  ),
  ghost: cn(
    'bg-white/70 border border-primary-base/12 text-primary-base backdrop-blur',
    'hover:bg-white hover:border-primary-base/25',
  ),
  danger: cn(
    'bg-red-50 text-red-600 border border-red-200',
    'hover:bg-red-100',
  ),
  outline: cn(
    'border border-gray-200 text-gray-400',
    'hover:bg-gray-500/5',
  ),
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

/* ── Component ──────────────────────────────────────────── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
          'transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light/50',
          'disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
