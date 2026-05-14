import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Pencil,
  Trash2,
  X,
  Shield,
  BarChart3,
  FileDown,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Staff } from '@/types'
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffPermissions,
} from '@/services/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

/* ── Permission config ────────────────────────────────────── */

interface PermissionDef {
  key: string
  label: string
  description: string
  icon: React.ElementType
  colors: { bg: string; border: string; text: string; badge: string }
}

const PERMISSIONS: PermissionDef[] = [
  {
    key: 'occurrences:triage',
    label: 'Triagem',
    description: 'Aprovar, rejeitar e gerenciar ocorrencias',
    icon: ClipboardCheck,
    colors: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-700',
      badge: 'bg-sky-100 text-sky-700',
    },
  },
  {
    key: 'occurrences:export',
    label: 'Exportar',
    description: 'Exportar relatorios em PDF',
    icon: FileDown,
    colors: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
    },
  },
  {
    key: 'bi:view',
    label: 'Dashboard',
    description: 'Visualizar estatisticas e graficos',
    icon: BarChart3,
    colors: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
    },
  },
  {
    key: 'staff:manage',
    label: 'Admin',
    description: 'Gerenciar operadores e permissoes',
    icon: Shield,
    colors: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-700',
    },
  },
]

function getPermissionDef(key: string): PermissionDef | undefined {
  return PERMISSIONS.find((p) => p.key === key)
}

/* ── Helpers ──────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/* ── Form state ───────────────────────────────────────────── */

interface StaffForm {
  name: string
  email: string
  password: string
  permissions: string[]
  is_active: boolean
}

const EMPTY_FORM: StaffForm = {
  name: '',
  email: '',
  password: '',
  permissions: [],
  is_active: true,
}

/* ── Modal overlay ────────────────────────────────────────── */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 lg:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full lg:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Create/Edit modal ────────────────────────────────────── */

function StaffFormModal({
  mode,
  initialData,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  initialData: StaffForm
  onClose: () => void
  onSubmit: (data: StaffForm) => Promise<void>
}) {
  const [form, setForm] = useState<StaffForm>(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField<K extends keyof StaffForm>(key: K, value: StaffForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function togglePermission(key: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar operador.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <GlassCard className="w-full max-w-full lg:max-w-md bg-background/95 backdrop-blur-2xl fixed inset-0 lg:inset-auto lg:relative overflow-y-auto rounded-none lg:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-shape">
          <h2 className="text-lg font-semibold text-primary-dark">
            {mode === 'create' ? 'Novo operador' : 'Editar operador'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="size-5 text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            placeholder="Nome completo"
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            placeholder="operador@email.com"
          />

          <Input
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required={mode === 'create'}
            placeholder={
              mode === 'edit'
                ? 'Deixe vazio para manter'
                : 'Senha do operador'
            }
          />

          {/* Permissions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">
              Permissoes
            </label>
            <div className="space-y-2">
              {PERMISSIONS.map((perm) => {
                const checked = form.permissions.includes(perm.key)
                const Icon = perm.icon
                return (
                  <label
                    key={perm.key}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200',
                      checked
                        ? 'bg-primary-base/10 border-primary-base/30'
                        : 'bg-white border-shape hover:border-primary-base/20',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm.key)}
                      className="size-4 rounded border-shape text-primary-base focus:ring-primary-light/30"
                    />
                    <Icon
                      className={cn('size-4 flex-shrink-0', perm.colors.text)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-400">
                        {perm.label}
                      </p>
                      <p className="text-xs text-gray-200">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Active toggle (edit only) */}
          {mode === 'edit' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200',
                  form.is_active ? 'bg-primary-base' : 'bg-gray-100',
                )}
                onClick={() => updateField('is_active', !form.is_active)}
              >
                <div
                  className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
                    form.is_active ? 'translate-x-[22px]' : 'translate-x-0.5',
                  )}
                />
              </div>
              <span className="text-sm font-medium text-gray-400">
                {form.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </label>
          )}

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Salvar
            </Button>
          </div>
        </form>
      </GlassCard>
    </ModalOverlay>
  )
}

/* ── Delete confirmation ──────────────────────────────────── */

function DeleteConfirmModal({
  staff,
  onClose,
  onConfirm,
}: {
  staff: Staff
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <GlassCard className="w-full max-w-[calc(100%-2rem)] lg:max-w-sm bg-background/95 backdrop-blur-2xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto size-12 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="size-5 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-primary-dark">
            Tem certeza?
          </h3>
          <p className="text-sm text-gray-300">
            O operador{' '}
            <span className="font-semibold text-gray-400">{staff.name}</span>{' '}
            sera removido permanentemente.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </GlassCard>
    </ModalOverlay>
  )
}

/* ── Staff card ───────────────────────────────────────────── */

function StaffCard({
  staff,
  onEdit,
  onDelete,
}: {
  staff: Staff
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className="p-5 space-y-4" hoverable>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 size-11 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {getInitials(staff.name)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary-dark truncate">
              {staff.name}
            </p>
            <p className="text-sm text-gray-300 truncate">{staff.email}</p>
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={cn(
                'size-2 rounded-full',
                staff.is_active ? 'bg-emerald-500' : 'bg-red-400',
              )}
            />
            <span className="text-xs font-medium text-gray-300">
              {staff.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {/* Permission badges */}
        <div className="flex flex-wrap gap-1.5">
          {staff.permissions.map((permKey) => {
            const def = getPermissionDef(permKey)
            if (!def) return null
            return (
              <span
                key={permKey}
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  def.colors.badge,
                )}
              >
                {def.label}
              </span>
            )
          })}
          {staff.permissions.length === 0 && (
            <span className="text-xs text-gray-200 italic">
              Sem permissoes
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-shape/50">
          <Button variant="ghost" size="sm" onClick={onEdit} className="min-h-[44px]">
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete} className="min-h-[44px]">
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ── Main Page ────────────────────────────────────────────── */

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)

  /* Fetch staff list */
  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStaff()
      setStaffList(data)
    } catch {
      /* silently handle */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  /* Open create modal */
  function openCreate() {
    setEditingStaff(null)
    setModalMode('create')
  }

  /* Open edit modal */
  function openEdit(staff: Staff) {
    setEditingStaff(staff)
    setModalMode('edit')
  }

  /* Close modal */
  function closeModal() {
    setModalMode(null)
    setEditingStaff(null)
  }

  /* Handle form submit */
  async function handleFormSubmit(form: StaffForm) {
    if (modalMode === 'create') {
      await createStaff({
        name: form.name,
        email: form.email,
        password: form.password,
        permissions: form.permissions,
      } as Parameters<typeof createStaff>[0] & { permissions: string[] })
    } else if (modalMode === 'edit' && editingStaff) {
      const basicData: Parameters<typeof updateStaff>[1] = {
        name: form.name,
        email: form.email,
        is_active: form.is_active,
      }

      // Include password only if provided
      if (form.password) {
        ;(basicData as Record<string, unknown>).password = form.password
      }

      await updateStaff(editingStaff.id, basicData)

      // Check if permissions changed
      const oldPerms = [...editingStaff.permissions].sort().join(',')
      const newPerms = [...form.permissions].sort().join(',')
      if (oldPerms !== newPerms) {
        await updateStaffPermissions(editingStaff.id, form.permissions)
      }
    }
    closeModal()
    fetchStaff()
  }

  /* Handle delete */
  async function handleDelete() {
    if (!deleteTarget) return
    await deleteStaff(deleteTarget.id)
    setDeleteTarget(null)
    fetchStaff()
  }

  /* Form initial data */
  const formInitialData: StaffForm =
    modalMode === 'edit' && editingStaff
      ? {
          name: editingStaff.name,
          email: editingStaff.email,
          password: '',
          permissions: [...editingStaff.permissions],
          is_active: editingStaff.is_active,
        }
      : EMPTY_FORM

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Top section */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm lg:text-base text-gray-300">Gerencie os operadores do sistema</p>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <UserPlus className="size-4" />
          <span className="hidden xs:inline">Novo operador</span>
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-base/20 border-t-primary-base" />
        </div>
      )}

      {/* Empty state */}
      {!loading && staffList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-primary-base/10 flex items-center justify-center mb-4">
            <UserPlus className="size-7 text-primary-base" />
          </div>
          <p className="text-gray-300 mb-1 font-medium">
            Nenhum operador cadastrado
          </p>
          <p className="text-sm text-gray-200">
            Clique em "Novo operador" para adicionar.
          </p>
        </div>
      )}

      {/* Staff grid */}
      {!loading && staffList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {staffList.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onEdit={() => openEdit(staff)}
                onDelete={() => setDeleteTarget(staff)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {modalMode && (
          <StaffFormModal
            key={modalMode + (editingStaff?.id ?? 'new')}
            mode={modalMode}
            initialData={formInitialData}
            onClose={closeModal}
            onSubmit={handleFormSubmit}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            key={`delete-${deleteTarget.id}`}
            staff={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
