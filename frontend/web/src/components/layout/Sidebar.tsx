import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Layers,
  FileText,
  Users,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'
import type { Permission } from '@/types'

/* ── Nav item config ────────────────────────────────────── */

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  permission: Permission
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'bi:view' },
  { label: 'Triagem', to: '/triage', icon: Layers, permission: 'occurrences:triage' },
  { label: 'Ocorrencias', to: '/occurrences', icon: FileText, permission: 'occurrences:triage' },
  { label: 'Equipe', to: '/staff', icon: Users, permission: 'staff:manage' },
]

/* ── Props ──────────────────────────────────────────────── */

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

/* ── Component ──────────────────────────────────────────── */

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { staff, logout, hasPermission } = useAuth()

  const visibleItems = navItems.filter((item) => hasPermission(item.permission))
  const showDivider = hasPermission('occurrences:export')

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  /* ── Sidebar content (shared between mobile & desktop) ── */
  const sidebarContent = (
    <>
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display tracking-tighter text-xl">
            <span className="font-semibold text-white">Eco</span>
            <span className="font-light text-white/70">Amazonia</span>
          </h1>
          <p className="text-white/40 text-xs mt-1">Painel da Prefeitura</p>
        </div>

        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden flex items-center justify-center size-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-white bg-white/15 shadow-lg shadow-black/10'
                    : 'text-white/60 hover:text-white hover:bg-white/10',
                )
              }
            >
              <Icon className="size-5" />
              {item.label}
            </NavLink>
          )
        })}

        {showDivider && (
          <div className="bg-white/10 h-px my-2" aria-hidden="true" />
        )}
      </nav>

      {/* ── User section ─────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/10">
        {staff && (
          <>
            <p className="text-white text-sm font-medium truncate">
              {staff.name}
            </p>
            <p className="text-white/50 text-xs truncate">{staff.email}</p>
          </>
        )}

        <button
          type="button"
          onClick={logout}
          className={cn(
            'mt-3 flex items-center gap-2 text-white/50 hover:text-white',
            'text-xs transition-all duration-200',
          )}
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar (always visible at lg+) ──────── */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-20 h-screen w-[260px] flex-col overflow-hidden',
          'bg-gradient-to-b from-primary-dark to-primary-base',
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer (overlay + slide panel) ────────── */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -80 || info.velocity.x < -500) {
                  onClose()
                }
              }}
              className={cn(
                'relative h-full w-[280px] flex flex-col overflow-hidden',
                'bg-gradient-to-b from-primary-dark to-primary-base',
                'shadow-2xl shadow-black/30',
              )}
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
