import { Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

interface TopBarProps {
  title: string
  onMenuClick: () => void
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

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { staff } = useAuth()

  return (
    <header
      className={cn(
        'sticky top-0 z-10 h-16 flex items-center justify-between',
        'px-4 lg:px-8',
        'bg-background/80 backdrop-blur-xl border-b border-shape',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center size-9 rounded-lg text-primary-dark hover:bg-shape transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="font-display text-lg lg:text-xl font-semibold text-primary-dark tracking-tight">
          {title}
        </h1>
      </div>

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
