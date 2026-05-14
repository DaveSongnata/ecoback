import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-400"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-white border border-shape',
            'text-primary-dark placeholder:text-gray-100 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
            'transition-all duration-200',
            error && 'border-red-300 focus:ring-red-200 focus:border-red-400',
            className,
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
