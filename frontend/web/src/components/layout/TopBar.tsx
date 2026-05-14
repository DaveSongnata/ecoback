import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

interface TopBarProps {
  title: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function TopBar({ title }: TopBarProps) {
  const { staff } = useAuth()

  return (
    <header
      className={cn(
        'sticky top-0 z-10 h-16 flex items-center justify-between px-8',
        'bg-background/80 backdrop-blur-xl border-b border-shape',
      )}
    >
      <h1 className="font-display text-xl font-semibold text-primary-dark tracking-tight">
        {title}
      </h1>

      {staff && (
        <div
          className={cn(
            'size-9 rounded-full bg-primary-light text-white',
            'flex items-center justify-center text-xs font-semibold select-none',
          )}
          title={staff.name}
        >
          {getInitials(staff.name)}
        </div>
      )}
    </header>
  )
}
