import { cn } from '@/utils/cn'
import type { OccurrenceStatus } from '@/types'

interface StatusBadgeProps {
  status: OccurrenceStatus
  className?: string
}

const statusConfig: Record<
  OccurrenceStatus,
  { label: string; badge: string; dot: string }
> = {
  em_analise: {
    label: 'Em analise',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  aprovada: {
    label: 'Aprovada',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  cancelada: {
    label: 'Cancelada',
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  concluida: {
    label: 'Concluida',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.badge,
        className,
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', config.dot)}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}
