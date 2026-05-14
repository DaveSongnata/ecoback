import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Occurrence } from '@/types'
import {
  getNextForTriage,
  approveOccurrence,
  rejectOccurrence,
} from '@/services/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

declare const L: any

/* ── Types ──────────────────────────────────────────────── */

type ActionMode = 'view' | 'approve' | 'reject'
type ExitDirection = 'left' | 'right' | null

interface ApproveFormData {
  notice: string
  scheduled_date: string
  scheduled_time: string
  team_name: string
}

interface RejectFormData {
  rejection_reason: string
}

/* ── Animation variants ─────────────────────────────────── */

const cardVariants = {
  enter: {
    scale: 0.95,
    opacity: 0,
  },
  center: {
    scale: 1,
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exitLeft: {
    x: -300,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
  exitRight: {
    x: 300,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
}

const formVariants = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden' as const },
  visible: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible' as const,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    height: 0,
    opacity: 0,
    overflow: 'hidden' as const,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

/* ── Component ──────────────────────────────────────────── */

export default function TriagePage() {
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionMode, setActionMode] = useState<ActionMode>('view')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null)
  const [cardKey, setCardKey] = useState(0)

  const [approveForm, setApproveForm] = useState<ApproveFormData>({
    notice: '',
    scheduled_date: '',
    scheduled_time: '',
    team_name: '',
  })

  const [rejectForm, setRejectForm] = useState<RejectFormData>({
    rejection_reason: '',
  })

  /* ── Fetch next occurrence ──────────────────────────────── */

  const fetchNext = useCallback(async () => {
    setLoading(true)
    try {
      const next = await getNextForTriage()
      setOccurrence(next)
      setCardKey((k) => k + 1)
      setPhotoIndex(0)
      setActionMode('view')
      setExitDirection(null)
      setApproveForm({ notice: '', scheduled_date: '', scheduled_time: '', team_name: '' })
      setRejectForm({ rejection_reason: '' })
    } catch {
      setOccurrence(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNext()
  }, [fetchNext])

  /* ── Leaflet map for coordinates ───────────────────────── */

  useEffect(() => {
    if (!mapContainerRef.current || !occurrence?.coordinates?.length) return
    if (typeof L === 'undefined') return

    // Clean up previous map instance
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const coords = occurrence.coordinates.sort((a, b) => a.position - b.position)
    const center: [number, number] = [coords[0].lat, coords[0].lng]

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: coords.length >= 2 ? 15 : 16,
      scrollWheelZoom: false,
      attributionControl: false,
    })
    mapRef.current = map

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

    // Force a size recalc after the container is painted
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [occurrence])

  /* ── Actions ────────────────────────────────────────────── */

  function handleActionClick(mode: 'approve' | 'reject') {
    setActionMode(mode)
  }

  function handleCancel() {
    setActionMode('view')
  }

  async function handleSkip() {
    setExitDirection('right')
    // Wait for exit animation, then fetch next
    setTimeout(() => fetchNext(), 320)
  }

  async function handleApproveSubmit() {
    if (!occurrence) return
    setSubmitting(true)
    try {
      await approveOccurrence(occurrence.id, {
        notice: approveForm.notice,
        scheduled_date: approveForm.scheduled_date,
        scheduled_time: approveForm.scheduled_time || undefined,
        team_name: approveForm.team_name,
      })
      setExitDirection('right')
      setTimeout(() => fetchNext(), 320)
    } catch {
      // Error handled silently; user can retry
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRejectSubmit() {
    if (!occurrence) return
    setSubmitting(true)
    try {
      await rejectOccurrence(occurrence.id, {
        rejection_reason: rejectForm.rejection_reason,
      })
      setExitDirection('left')
      setTimeout(() => fetchNext(), 320)
    } catch {
      // Error handled silently; user can retry
    } finally {
      setSubmitting(false)
    }
  }

  function handlePhotoClick() {
    if (!occurrence || occurrence.photos.length <= 1) return
    setPhotoIndex((i) => (i + 1) % occurrence.photos.length)
  }

  /* ── Format helpers ─────────────────────────────────────── */

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /* ── Loading state ──────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary-light" />
      </div>
    )
  }

  /* ── Empty state ────────────────────────────────────────── */

  if (!occurrence) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary-clin/10">
          <CheckCircle2 className="size-8 text-primary-clin" />
        </div>
        <p className="font-display text-lg font-semibold tracking-tighter text-primary-dark">
          Nenhuma ocorrencia pendente
        </p>
        <p className="text-sm text-primary-clin">
          Todas as ocorrencias foram triadas. Bom trabalho!
        </p>
      </div>
    )
  }

  /* ── Derived data ───────────────────────────────────────── */

  const photos = occurrence.photos.sort((a, b) => a.position - b.position)
  const currentPhoto = photos[photoIndex]
  const coord = occurrence.coordinates[0] ?? null
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex min-h-[60vh] items-start justify-center px-2 lg:px-4 py-4 lg:py-8">
      <div className="w-full max-w-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={cardKey}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit={exitDirection === 'left' ? 'exitLeft' : 'exitRight'}
          >
            <GlassCard>
              {/* ── Photo section ─────────────────────────── */}
              {photos.length > 0 && (
                <div className="relative">
                  <img
                    src={currentPhoto.url}
                    alt={`Foto ${photoIndex + 1}`}
                    className={cn(
                      'h-48 lg:h-64 w-full rounded-t-2xl object-cover',
                      photos.length > 1 && 'cursor-pointer',
                    )}
                    onClick={handlePhotoClick}
                  />

                  {/* Dots indicator */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotoIndex(i)
                          }}
                          className={cn(
                            'size-2.5 rounded-full transition-all duration-200',
                            i === photoIndex
                              ? 'scale-125 bg-white'
                              : 'bg-white/50 hover:bg-white/75',
                          )}
                          aria-label={`Foto ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Info section ──────────────────────────── */}
              <div className="space-y-3 p-4 lg:p-6">
                {/* Protocol */}
                <span className="font-mono text-sm font-semibold text-primary-base">#{occurrence.protocol}</span>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={occurrence.status} />
                  {occurrence.category && (
                    <span className="inline-flex items-center rounded-full border border-primary-light/20 bg-primary-light/10 px-2.5 py-1 text-xs font-medium text-primary-light">
                      {occurrence.category.name}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="font-display text-lg font-semibold tracking-tighter text-primary-dark">
                  {[occurrence.neighborhood, occurrence.street]
                    .filter(Boolean)
                    .join(' - ') || 'Sem endereco'}
                </h2>

                {/* Address details */}
                <div className="space-y-0.5 text-sm text-gray-300">
                  {occurrence.address && <p>{occurrence.address}</p>}
                  <p>
                    {[occurrence.cep, occurrence.city?.name]
                      .filter(Boolean)
                      .join(' - ')}
                  </p>
                </div>

                {/* Observation */}
                {occurrence.observation && (
                  <p className="mt-2 text-sm italic text-gray-400">
                    {occurrence.observation}
                  </p>
                )}

                {/* Reporter info */}
                {occurrence.user && (
                  <div className="space-y-0.5 text-xs text-gray-200">
                    <p>Reportado por: {occurrence.user.email}</p>
                    {occurrence.user.phone && <p>Tel: {occurrence.user.phone}</p>}
                  </div>
                )}

                {/* Coordinates map */}
                {occurrence.coordinates.length > 0 && (
                  <div className="rounded-xl overflow-hidden h-40 lg:h-48" ref={mapContainerRef} />
                )}

                {/* Created at */}
                <p className="text-xs text-gray-200">
                  Criado em: {formatDate(occurrence.created_at)}
                </p>
              </div>

              {/* ── Action section ────────────────────────── */}
              <div className="border-t border-shape p-4 lg:p-6">
                {/* Initial view: action buttons */}
                {actionMode === 'view' && (
                  <div className="flex items-center justify-center gap-3 lg:gap-4">
                    <Button
                      variant="danger"
                      size="lg"
                      className="rounded-full min-h-[48px] min-w-[48px]"
                      onClick={() => handleActionClick('reject')}
                    >
                      <X className="size-5" />
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-full min-h-[44px] min-w-[44px]"
                      onClick={handleSkip}
                    >
                      <ArrowRight className="size-5" />
                    </Button>

                    <Button
                      variant="primary"
                      size="lg"
                      className="rounded-full min-h-[48px] min-w-[48px]"
                      onClick={() => handleActionClick('approve')}
                    >
                      <Check className="size-5" />
                    </Button>
                  </div>
                )}

                {/* Approve form */}
                <AnimatePresence>
                  {actionMode === 'approve' && (
                    <motion.div
                      variants={formVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleApproveSubmit()
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label
                            htmlFor="approve-notice"
                            className="block text-sm font-medium text-gray-400"
                          >
                            Observacao do agente
                          </label>
                          <textarea
                            id="approve-notice"
                            required
                            rows={3}
                            value={approveForm.notice}
                            onChange={(e) =>
                              setApproveForm((f) => ({ ...f, notice: e.target.value }))
                            }
                            className={cn(
                              'w-full rounded-xl border border-shape bg-white px-4 py-2.5 text-sm text-primary-dark',
                              'placeholder:text-gray-100',
                              'focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/30',
                              'transition-all duration-200',
                            )}
                            placeholder="Descreva a analise realizada..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Data agendada"
                            type="date"
                            required
                            value={approveForm.scheduled_date}
                            onChange={(e) =>
                              setApproveForm((f) => ({
                                ...f,
                                scheduled_date: e.target.value,
                              }))
                            }
                          />
                          <Input
                            label="Horario"
                            type="time"
                            value={approveForm.scheduled_time}
                            onChange={(e) =>
                              setApproveForm((f) => ({
                                ...f,
                                scheduled_time: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <Input
                          label="Equipe responsavel"
                          type="text"
                          required
                          value={approveForm.team_name}
                          onChange={(e) =>
                            setApproveForm((f) => ({
                              ...f,
                              team_name: e.target.value,
                            }))
                          }
                          placeholder="Nome da equipe"
                        />

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            loading={submitting}
                          >
                            Confirmar aprovacao
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reject form */}
                <AnimatePresence>
                  {actionMode === 'reject' && (
                    <motion.div
                      variants={formVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleRejectSubmit()
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label
                            htmlFor="reject-reason"
                            className="block text-sm font-medium text-gray-400"
                          >
                            Motivo da rejeicao
                          </label>
                          <textarea
                            id="reject-reason"
                            required
                            minLength={10}
                            rows={3}
                            value={rejectForm.rejection_reason}
                            onChange={(e) =>
                              setRejectForm({ rejection_reason: e.target.value })
                            }
                            className={cn(
                              'w-full rounded-xl border border-shape bg-white px-4 py-2.5 text-sm text-primary-dark',
                              'placeholder:text-gray-100',
                              'focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/30',
                              'transition-all duration-200',
                            )}
                            placeholder="Explique o motivo da rejeicao (minimo 10 caracteres)..."
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="danger"
                            loading={submitting}
                          >
                            Confirmar rejeicao
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
