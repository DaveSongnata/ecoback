import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

export function GlassCard({
  children,
  className,
  hoverable = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/70 border border-white/60 backdrop-blur-xl shadow-glass overflow-hidden transition-all duration-300',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-soft',
        className,
      )}
    >
      {children}
    </div>
  )
}
