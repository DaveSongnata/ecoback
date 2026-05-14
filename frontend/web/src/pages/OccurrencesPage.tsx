import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Download,
  Eye,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Occurrence } from '@/types'
import {
  getOccurrences,
  completeOccurrence,
  getCategories,
  exportPdf,
} from '@/services/api'
import { generateOccurrencesPdf } from '@/utils/pdf'
import { useAuth } from '@/contexts/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

declare const L: any

/* ── Helpers ──────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function truncate(text: string, max = 30): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

/* ── Filter types ─────────────────────────────────────────── */

interface Filters {
  status: string
  category: string
  neighborhood: string
  date_from: string
  date_to: string
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'em_analise', label: 'Em analise' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'concluida', label: 'Concluida' },
]

/* ── Detail Panel ─────────────────────────────────────────── */

function DetailPanel({
  occurrence,
  onClose,
  onComplete,
}: {
  occurrence: Occurrence
  onClose: () => void
  onComplete: (id: string, notice?: string) => Promise<void>
}) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [completeNotice, setCompleteNotice] = useState('')
  const detailMapRef = useRef<HTMLDivElement>(null)
  const detailMapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!detailMapRef.current || !occurrence.coordinates?.length) return
    if (typeof L === 'undefined') return

    if (detailMapInstanceRef.current) {
      detailMapInstanceRef.current.remove()
      detailMapInstanceRef.current = null
    }

    const coords = occurrence.coordinates.sort((a, b) => a.position - b.position)
    const center: [number, number] = [coords[0].lat, coords[0].lng]

    const map = L.map(detailMapRef.current, {
      center,
      zoom: coords.length >= 2 ? 15 : 16,
      scrollWheelZoom: false,
      attributionControl: false,
    })
    detailMapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    const latLngs: [number, number][] = coords.map((c) => [c.lat, c.lng] as [number, number])

    latLngs.forEach((ll) => {
      L.marker(ll).addTo(map)
    })

    if (latLngs.length >= 2) {
      L.polygon(latLngs, {
        color: '#155B5B',
        weight: 2,
        fillColor: '#155B5B',
        fillOpacity: 0.15,
      }).addTo(map)
      map.fitBounds(L.latLngBounds(latLngs).pad(0.2))
    }

    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      if (detailMapInstanceRef.current) {
        detailMapInstanceRef.current.remove()
        detailMapInstanceRef.current = null
      }
    }
  }, [occurrence])

  async function handleComplete() {
    setCompleting(true)
    try {
      await onComplete(
        occurrence.id,
        completeNotice.trim() || undefined,
      )
      setShowCompleteForm(false)
      setCompleteNotice('')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-full lg:max-w-lg h-full overflow-y-auto bg-background shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 backdrop-blur-xl border-b border-shape px-6 py-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={occurrence.status} />
            <span className="font-mono text-sm font-semibold text-primary-base">#{occurrence.protocol}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/70 transition-colors"
          >
            <X className="size-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo gallery */}
          {occurrence.photos.length > 0 && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-white/50 aspect-video">
                <img
                  src={occurrence.photos[photoIndex]?.url}
                  alt={`Foto ${photoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {occurrence.photos.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {occurrence.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className={cn(
                        'size-2.5 rounded-full transition-all duration-200',
                        i === photoIndex
                          ? 'bg-primary-base scale-110'
                          : 'bg-gray-100 hover:bg-gray-200',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Occurrence info */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">
              Informacoes da ocorrencia
            </h3>
            <dl className="space-y-3 text-sm">
              {occurrence.category && (
                <div className="flex justify-between">
                  <dt className="text-gray-200">Categoria</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.category.name}
                  </dd>
                </div>
              )}
              {occurrence.city && (
                <div className="flex justify-between">
                  <dt className="text-gray-200">Cidade</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.city.name}
                  </dd>
                </div>
              )}
              {occurrence.neighborhood && (
                <div className="flex justify-between">
                  <dt className="text-gray-200">Bairro</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.neighborhood}
                  </dd>
                </div>
              )}
              {occurrence.street && (
                <div className="flex justify-between">
                  <dt className="text-gray-200">Rua</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.street}
                  </dd>
                </div>
              )}
              {occurrence.address && (
                <div className="flex justify-between">
                  <dt className="text-gray-200">Endereco</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.address}
                  </dd>
                </div>
              )}
              {occurrence.cep && (
                <div className="flex justify-between">
                  <dt className="text-gray-200">CEP</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.cep}
                  </dd>
                </div>
              )}
              {occurrence.observation && (
                <div>
                  <dt className="text-gray-200 mb-1">Observacao</dt>
                  <dd className="font-medium text-gray-400 bg-white/50 rounded-xl p-3">
                    {occurrence.observation}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-200">Criado em</dt>
                <dd className="font-medium text-gray-400">
                  {formatDate(occurrence.created_at)}
                </dd>
              </div>
            </dl>
          </GlassCard>

          {/* Coordinates map */}
          {occurrence.coordinates?.length > 0 && (
            <div className="rounded-xl overflow-hidden h-40 lg:h-48" ref={detailMapRef} />
          )}

          {/* Response info */}
          {occurrence.response && (
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">
                Resposta
              </h3>
              <dl className="space-y-3 text-sm">
                {occurrence.response.notice && (
                  <div>
                    <dt className="text-gray-200 mb-1">Aviso</dt>
                    <dd className="font-medium text-gray-400 bg-white/50 rounded-xl p-3">
                      {occurrence.response.notice}
                    </dd>
                  </div>
                )}
                {occurrence.response.scheduled_date && (
                  <div className="flex justify-between">
                    <dt className="text-gray-200">Data agendada</dt>
                    <dd className="font-medium text-gray-400">
                      {formatDate(occurrence.response.scheduled_date)}
                      {occurrence.response.scheduled_time &&
                        ` as ${occurrence.response.scheduled_time}`}
                    </dd>
                  </div>
                )}
                {occurrence.response.team_name && (
                  <div className="flex justify-between">
                    <dt className="text-gray-200">Equipe</dt>
                    <dd className="font-medium text-gray-400">
                      {occurrence.response.team_name}
                    </dd>
                  </div>
                )}
                {occurrence.response.rejection_reason && (
                  <div>
                    <dt className="text-gray-200 mb-1">Motivo da rejeicao</dt>
                    <dd className="font-medium text-red-600 bg-red-50 rounded-xl p-3">
                      {occurrence.response.rejection_reason}
                    </dd>
                  </div>
                )}
                {occurrence.response.responded_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-200">Respondido em</dt>
                    <dd className="font-medium text-gray-400">
                      {formatDate(occurrence.response.responded_at)}
                    </dd>
                  </div>
                )}
              </dl>
            </GlassCard>
          )}

          {/* Reporter info */}
          {occurrence.user && (
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">
                Denunciante
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-200">Email</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.user.email}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-200">Telefone</dt>
                  <dd className="font-medium text-gray-400">
                    {occurrence.user.phone}
                  </dd>
                </div>
              </dl>
            </GlassCard>
          )}

          {/* Complete action */}
          {occurrence.status === 'aprovada' && (
            <div className="space-y-3">
              {!showCompleteForm ? (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setShowCompleteForm(true)}
                >
                  <CheckCircle2 className="size-4" />
                  Marcar como concluida
                </Button>
              ) : (
                <GlassCard className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400">
                    Concluir ocorrencia
                  </h3>
                  <textarea
                    placeholder="Observacao de conclusao (opcional)"
                    value={completeNotice}
                    onChange={(e) => setCompleteNotice(e.target.value)}
                    rows={3}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl bg-white border border-shape',
                      'text-primary-dark placeholder:text-gray-100 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
                      'transition-all duration-200 resize-none',
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCompleteForm(false)
                        setCompleteNotice('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={completing}
                      onClick={handleComplete}
                    >
                      Confirmar conclusao
                    </Button>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Main Page ────────────────────────────────────────────── */

export default function OccurrencesPage() {
  const { hasPermission } = useAuth()
  const canExport = hasPermission('occurrences:export')

  /* State */
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0 })
  const [filters, setFilters] = useState<Filters>({
    status: '',
    category: '',
    neighborhood: '',
    date_from: '',
    date_to: '',
  })
  const [categories, setCategories] = useState<
    { id: string; slug: string; name: string }[]
  >([])
  const [selectedOccurrence, setSelectedOccurrence] =
    useState<Occurrence | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  /* Debounce ref for neighborhood */
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  /* Load categories on mount */
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  /* Fetch occurrences */
  const fetchOccurrences = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params: Record<string, string | number | undefined> = {
          page,
          per_page: 20,
        }
        if (filters.status) params.status = filters.status
        if (filters.category) params.category_id = filters.category
        if (filters.neighborhood)
          params.neighborhood = filters.neighborhood
        if (filters.date_from) params.date_from = filters.date_from
        if (filters.date_to) params.date_to = filters.date_to

        const response = await getOccurrences(params)
        setOccurrences(response.data)
        setMeta(response.meta)
      } catch {
        /* silently handle */
      } finally {
        setLoading(false)
      }
    },
    [filters],
  )

  /* Refetch on filter or page change */
  useEffect(() => {
    fetchOccurrences(meta.page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  /* Filter change handlers */
  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setMeta((prev) => ({ ...prev, page: 1 }))
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleNeighborhoodChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateFilter('neighborhood', value)
    }, 400)
  }

  /* Pagination */
  const totalPages = Math.ceil(meta.total / meta.per_page) || 1

  function goToPage(page: number) {
    setMeta((prev) => ({ ...prev, page }))
    fetchOccurrences(page)
  }

  /* Selection for export */
  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === occurrences.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(occurrences.map((o) => o.id)))
    }
  }

  /* Export PDF */
  async function handleExport() {
    if (selectedIds.size === 0) return
    setExporting(true)
    try {
      const data = await exportPdf(Array.from(selectedIds))
      generateOccurrencesPdf(data)
    } catch {
      /* silently handle */
    } finally {
      setExporting(false)
    }
  }

  /* Complete occurrence */
  async function handleComplete(id: string, notice?: string) {
    await completeOccurrence(id, notice ? { notice } : {})
    setSelectedOccurrence(null)
    fetchOccurrences(meta.page)
  }

  /* Inline complete from table */
  async function handleInlineComplete(id: string) {
    await completeOccurrence(id, {})
    fetchOccurrences(meta.page)
  }

  /* Computed */
  const showFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.per_page + 1
  const showTo = Math.min(meta.page * meta.per_page, meta.total)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Filters bar */}
      <GlassCard className="p-4 lg:p-5">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:flex lg:flex-wrap lg:items-end gap-3">
          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-400">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                updateFilter('status', e.target.value)
              }
              className={cn(
                'w-full lg:w-auto px-4 py-2.5 rounded-xl bg-white border border-shape',
                'text-primary-dark text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
                'transition-all duration-200',
              )}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-400">
              Categoria
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                updateFilter('category', e.target.value)
              }
              className={cn(
                'w-full lg:w-auto px-4 py-2.5 rounded-xl bg-white border border-shape',
                'text-primary-dark text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
                'transition-all duration-200',
              )}
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Neighborhood */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-400">
              Bairro
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-100" />
              <input
                type="text"
                placeholder="Buscar bairro..."
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className={cn(
                  'w-full lg:w-auto pl-9 pr-4 py-2.5 rounded-xl bg-white border border-shape',
                  'text-primary-dark placeholder:text-gray-100 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
                  'transition-all duration-200',
                )}
              />
            </div>
          </div>

          {/* Date from */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-400">
              De
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                updateFilter('date_from', e.target.value)
              }
              className={cn(
                'w-full lg:w-auto px-4 py-2.5 rounded-xl bg-white border border-shape',
                'text-primary-dark text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
                'transition-all duration-200',
              )}
            />
          </div>

          {/* Date to */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-400">
              Ate
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                updateFilter('date_to', e.target.value)
              }
              className={cn(
                'w-full lg:w-auto px-4 py-2.5 rounded-xl bg-white border border-shape',
                'text-primary-dark text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light',
                'transition-all duration-200',
              )}
            />
          </div>

          {/* Spacer - only on desktop */}
          <div className="hidden lg:block flex-1" />

          {/* Export PDF */}
          {canExport && (
            <div className="xs:col-span-2">
              <Button
                variant="ghost"
                size="sm"
                loading={exporting}
                disabled={selectedIds.size === 0}
                onClick={handleExport}
                className="w-full lg:w-auto"
              >
                <Download className="size-4" />
                Exportar PDF
              </Button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Desktop Table */}
      <GlassCard className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shape">
                {canExport && (
                  <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                    <input
                      type="checkbox"
                      checked={
                        occurrences.length > 0 &&
                        selectedIds.size === occurrences.length
                      }
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-shape text-primary-base focus:ring-primary-light/30 cursor-pointer"
                    />
                  </th>
                )}
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Protocolo
                </th>
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Categoria
                </th>
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Bairro
                </th>
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Endereco
                </th>
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Data
                </th>
                <th className="text-left text-xs font-medium text-gray-200 uppercase tracking-wider py-3 px-4">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canExport ? 8 : 7}
                    className="py-16 text-center"
                  >
                    <Loader2 className="size-6 animate-spin text-primary-base mx-auto" />
                  </td>
                </tr>
              ) : occurrences.length === 0 ? (
                <tr>
                  <td
                    colSpan={canExport ? 8 : 7}
                    className="py-16 text-center text-gray-200"
                  >
                    Nenhuma ocorrencia encontrada.
                  </td>
                </tr>
              ) : (
                occurrences.map((occ, idx) => (
                  <tr
                    key={occ.id}
                    className={cn(
                      'border-b border-shape/50 hover:bg-primary-base/5 transition-colors',
                      idx % 2 === 1 && 'bg-white/30',
                    )}
                  >
                    {canExport && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(occ.id)}
                          onChange={() => toggleSelection(occ.id)}
                          className="size-4 rounded border-shape text-primary-base focus:ring-primary-light/30 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono text-sm font-semibold text-primary-base">#{occ.protocol}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={occ.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {occ.category?.name ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {occ.neighborhood ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {truncate(
                        [occ.street, occ.address]
                          .filter(Boolean)
                          .join(', ') || '-',
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatDate(occ.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedOccurrence(occ)}
                          className="p-2 rounded-lg hover:bg-primary-base/10 text-primary-base transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="size-4" />
                        </button>
                        {occ.status === 'aprovada' && (
                          <button
                            onClick={() => handleInlineComplete(occ.id)}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            title="Marcar como concluida"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {!loading && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-shape px-5 py-4">
            <span className="text-sm text-gray-200">
              Mostrando {showFrom} a {showTo} de {meta.total} ocorrencias
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => goToPage(meta.page - 1)}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>

              <span className="px-3 py-1.5 text-sm font-medium text-gray-400 bg-white/50 rounded-lg">
                {meta.page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= totalPages}
                onClick={() => goToPage(meta.page + 1)}
              >
                Proximo
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {/* Mobile select all */}
        {canExport && occurrences.length > 0 && !loading && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={
                occurrences.length > 0 &&
                selectedIds.size === occurrences.length
              }
              onChange={toggleSelectAll}
              className="size-4 rounded border-shape text-primary-base focus:ring-primary-light/30 cursor-pointer"
            />
            <span className="text-sm text-gray-300">Selecionar todos</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary-base" />
          </div>
        ) : occurrences.length === 0 ? (
          <div className="py-16 text-center text-gray-200">
            Nenhuma ocorrencia encontrada.
          </div>
        ) : (
          occurrences.map((occ) => (
            <GlassCard key={occ.id} className="p-4 relative">
              {/* Export checkbox */}
              {canExport && (
                <div className="absolute top-3 right-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(occ.id)}
                    onChange={() => toggleSelection(occ.id)}
                    className="size-4 rounded border-shape text-primary-base focus:ring-primary-light/30 cursor-pointer"
                  />
                </div>
              )}

              {/* Protocol */}
              <span className="font-mono text-sm font-semibold text-primary-base mb-1">#{occ.protocol}</span>

              {/* Status + Category row */}
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={occ.status} />
                <span className="text-xs text-gray-300">
                  {occ.category?.name ?? '-'}
                </span>
              </div>

              {/* Location title */}
              <p className="text-sm font-medium text-primary-dark mb-1.5 pr-6">
                {[occ.neighborhood, occ.street]
                  .filter(Boolean)
                  .join(' - ') || 'Sem endereco'}
              </p>

              {/* Date + Actions row */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-200">
                  {formatDate(occ.created_at)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedOccurrence(occ)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-primary-base/10 text-primary-base transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye className="size-5" />
                  </button>
                  {occ.status === 'aprovada' && (
                    <button
                      onClick={() => handleInlineComplete(occ.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                      title="Marcar como concluida"
                    >
                      <CheckCircle2 className="size-5" />
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}

        {/* Mobile Pagination */}
        {!loading && meta.total > 0 && (
          <div className="flex items-center justify-between px-1 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
              className="min-h-[44px]"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>

            <span className="px-3 py-1.5 text-sm font-medium text-gray-400 bg-white/50 rounded-lg">
              {meta.page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
              className="min-h-[44px]"
            >
              Proximo
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Detail panel overlay */}
      <AnimatePresence>
        {selectedOccurrence && (
          <DetailPanel
            key={selectedOccurrence.id}
            occurrence={selectedOccurrence}
            onClose={() => setSelectedOccurrence(null)}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
