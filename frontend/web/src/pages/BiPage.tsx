import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Timer,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from 'recharts'

import { GlassCard } from '@/components/ui/GlassCard'
import {
  getBiOverview,
  getBiByCategory,
  getBiByNeighborhood,
  getBiByPeriod,
  getBiResponseTime,
  getBiHeatmap,
} from '@/services/api'
import type {
  BiOverview,
  BiCategoryRow,
  BiNeighborhoodRow,
  BiPeriodRow,
  BiResponseTimeRow,
  HeatmapPoint,
} from '@/types'

declare const L: any

/* ── Color constants ────────────────────────────────────── */

const COLORS = {
  primaryClin: '#579D67',
  primaryLight: '#268C8C',
  primaryBase: '#155B5B',
  primaryDark: '#0A2E2E',
  accentBase: '#D97D65',
  accentLight: '#F2C4B3',
  shape: '#EDE9F2',
}

const STATUS_COLORS: Record<string, string> = {
  em_analise: '#F59E0B',
  aprovada: '#0EA5E9',
  cancelada: '#EF4444',
  concluida: '#10B981',
}

const STATUS_LABELS: Record<string, string> = {
  em_analise: 'Em Analise',
  aprovada: 'Aprovada',
  cancelada: 'Cancelada',
  concluida: 'Concluida',
}

/* ── Framer motion variants ─────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

/* ── Custom Tooltip ─────────────────────────────────────── */

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-glass backdrop-blur">
      <p className="mb-1 text-xs font-semibold text-primary-dark">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function ResponseTimeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  // Find total from the original data point
  const point = (data as TooltipPayloadItem & { payload?: BiResponseTimeRow })
    .payload
  return (
    <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-glass backdrop-blur">
      <p className="mb-1 text-xs font-semibold text-primary-dark">{label}</p>
      <p className="text-sm" style={{ color: COLORS.accentBase }}>
        {data.value}h media
      </p>
      {point && (
        <p className="text-sm text-gray-300">
          {point.total} ocorrencias
        </p>
      )}
    </div>
  )
}

/* ── Skeleton Components ────────────────────────────────── */

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-shape" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-20 animate-pulse rounded-lg bg-shape" />
              <div className="h-4 w-28 animate-pulse rounded-lg bg-shape" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function ChartSkeleton({ height = 300, mobileHeight }: { height?: number; mobileHeight?: number }) {
  return (
    <GlassCard className="p-4 lg:p-6">
      <div className="mb-4 space-y-2">
        <div className="h-5 w-36 animate-pulse rounded-lg bg-shape" />
        <div className="h-4 w-48 animate-pulse rounded-lg bg-shape" />
      </div>
      <div
        className="animate-pulse rounded-xl bg-shape"
        style={{ height: mobileHeight ?? height }}
      />
    </GlassCard>
  )
}

function RankingSkeleton() {
  return (
    <GlassCard className="p-6 lg:col-span-2">
      <div className="mb-4 space-y-2">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-shape" />
        <div className="h-4 w-56 animate-pulse rounded-lg bg-shape" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-5 w-6 animate-pulse rounded bg-shape" />
            <div className="h-4 w-28 animate-pulse rounded bg-shape" />
            <div className="h-2 flex-1 animate-pulse rounded-full bg-shape" />
            <div className="h-4 w-8 animate-pulse rounded bg-shape" />
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function DonutSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-shape" />
      <div className="flex items-center justify-center">
        <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-shape" />
      </div>
    </GlassCard>
  )
}

/* ── KPI Card ───────────────────────────────────────────── */

interface KpiCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  iconBg: string
}

function KpiCard({ icon, value, label, iconBg }: KpiCardProps) {
  return (
    <GlassCard hoverable className="p-4 lg:p-5">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className={`rounded-xl p-2 lg:p-2.5 ${iconBg}`}>{icon}</div>
        <div>
          <p className="font-display text-xl lg:text-2xl font-bold tracking-tight text-primary-dark">
            {value}
          </p>
          <p className="text-xs lg:text-sm text-gray-300">{label}</p>
        </div>
      </div>
    </GlassCard>
  )
}

/* ── Custom Legend for Pie ──────────────────────────────── */

function DonutLegend({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-300">
            {entry.name} ({entry.value})
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────── */

export default function BiPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<BiOverview | null>(null)
  const [byCategory, setByCategory] = useState<BiCategoryRow[]>([])
  const [byNeighborhood, setByNeighborhood] = useState<BiNeighborhoodRow[]>([])
  const [byPeriod, setByPeriod] = useState<BiPeriodRow[]>([])
  const [responseTime, setResponseTime] = useState<BiResponseTimeRow[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([])
  const heatmapContainerRef = useRef<HTMLDivElement>(null)
  const heatmapMapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [ov, cat, neigh, per, resp, heat] = await Promise.all([
          getBiOverview(),
          getBiByCategory(),
          getBiByNeighborhood(),
          getBiByPeriod(),
          getBiResponseTime(),
          getBiHeatmap(),
        ])

        if (cancelled) return

        setOverview(ov)
        setByCategory(cat)
        setByNeighborhood(neigh)
        setByPeriod(per)
        setResponseTime(resp)
        setHeatmapData(heat)
      } catch (err) {
        console.error('Failed to load BI data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  // Heatmap Leaflet effect
  useEffect(() => {
    if (loading || !heatmapData.length || !heatmapContainerRef.current) return
    if (typeof L === 'undefined') return

    // Clean up previous
    if (heatmapMapRef.current) {
      heatmapMapRef.current.remove()
      heatmapMapRef.current = null
    }

    // Center on Manaus
    const map = L.map(heatmapContainerRef.current, {
      center: [-3.119, -60.022],
      zoom: 12,
      scrollWheelZoom: true,
      attributionControl: false,
    })
    heatmapMapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Build heatmap data: [lat, lng, intensity]
    const maxWeight = Math.max(...heatmapData.map(p => p.weight), 1)
    const points = heatmapData.map(p => [p.lat, p.lng, p.weight / maxWeight])

    // @ts-ignore - leaflet.heat plugin
    L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1,
      gradient: {
        0.2: '#155B5B',
        0.4: '#268C8C',
        0.6: '#579D67',
        0.8: '#F59E0B',
        1.0: '#EF4444',
      },
    }).addTo(map)

    // Fit bounds if we have data
    if (heatmapData.length > 0) {
      const bounds = L.latLngBounds(heatmapData.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds.pad(0.1))
    }

    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      if (heatmapMapRef.current) {
        heatmapMapRef.current.remove()
        heatmapMapRef.current = null
      }
    }
  }, [loading, heatmapData])

  /* ── Loading skeleton ─────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6">
        <KpiSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RankingSkeleton />
          <ChartSkeleton height={250} />
        </div>
        <DonutSkeleton />
        <div className="animate-pulse rounded-2xl bg-shape h-[300px] lg:h-[480px]" />
      </div>
    )
  }

  /* ── Prepare data ─────────────────────────────────────── */

  const periodData = byPeriod.map((row) => ({
    period: row.period,
    total: row.total,
    concluida: row.by_status.concluida,
    cancelada: row.by_status.cancelada,
  }))

  const categoryData = byCategory.map((row) => ({
    name: row.name,
    total: row.total,
    concluida: row.by_status.concluida,
  }))

  const sortedNeighborhoods = [...byNeighborhood]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const maxNeighborhoodTotal = sortedNeighborhoods[0]?.total || 1

  const statusDonutData = overview
    ? [
        { name: STATUS_LABELS.em_analise, value: overview.by_status.em_analise, color: STATUS_COLORS.em_analise },
        { name: STATUS_LABELS.aprovada, value: overview.by_status.aprovada, color: STATUS_COLORS.aprovada },
        { name: STATUS_LABELS.cancelada, value: overview.by_status.cancelada, color: STATUS_COLORS.cancelada },
        { name: STATUS_LABELS.concluida, value: overview.by_status.concluida, color: STATUS_COLORS.concluida },
      ].filter((d) => d.value > 0)
    : []

  const responseTimeData = responseTime.map((row) => ({
    ...row,
    period: row.period,
    avg_hours: Math.round(row.avg_hours * 10) / 10,
  }))

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Section 1: KPI Cards ──────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={cardVariants}>
          <KpiCard
            icon={<BarChart3 className="size-5 text-primary-light" />}
            iconBg="bg-primary-light/10"
            value={overview?.total ?? 0}
            label="Total de Ocorrencias"
          />
        </motion.div>

        <motion.div variants={cardVariants}>
          <KpiCard
            icon={<Clock className="size-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            value={overview?.by_status.em_analise ?? 0}
            label="Em Analise"
          />
        </motion.div>

        <motion.div variants={cardVariants}>
          <KpiCard
            icon={<CheckCircle2 className="size-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            value={overview?.by_status.concluida ?? 0}
            label="Concluidas"
          />
        </motion.div>

        <motion.div variants={cardVariants}>
          <KpiCard
            icon={<Timer className="size-5 text-accent-base" />}
            iconBg="bg-accent-base/10"
            value={`${overview?.avg_response_hours ?? 0}h`}
            label="Tempo Medio de Resposta"
          />
        </motion.div>
      </motion.div>

      {/* ── Section 2: Charts Row ─────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Line Chart: Evolucao Temporal */}
        <motion.div variants={cardVariants}>
          <GlassCard className="p-4 lg:p-6">
            <div className="mb-4">
              <h3 className="font-display text-base lg:text-lg font-semibold text-primary-dark">
                Evolucao Temporal
              </h3>
              <p className="text-xs lg:text-sm text-gray-300">Ocorrencias por mes</p>
            </div>
            <div className="h-[200px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={periodData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.05)"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: '#666666' }}
                  axisLine={{ stroke: '#EDE9F2' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#666666' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke={COLORS.primaryBase}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.primaryBase, r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.primaryBase }}
                />
                <Line
                  type="monotone"
                  dataKey="concluida"
                  name="Concluidas"
                  stroke={COLORS.primaryClin}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primaryClin, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.primaryClin }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelada"
                  name="Canceladas"
                  stroke={COLORS.accentBase}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ fill: COLORS.accentBase, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.accentBase }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Bar Chart: Por Categoria */}
        <motion.div variants={cardVariants}>
          <GlassCard className="p-4 lg:p-6">
            <div className="mb-4">
              <h3 className="font-display text-base lg:text-lg font-semibold text-primary-dark">
                Por Categoria
              </h3>
              <p className="text-xs lg:text-sm text-gray-300">
                Total e concluidas por categoria
              </p>
            </div>
            <div className="h-[200px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#666666' }}
                  axisLine={{ stroke: '#EDE9F2' }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#666666' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="total"
                  name="Total"
                  fill={COLORS.primaryLight}
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="concluida"
                  name="Concluidas"
                  fill={COLORS.primaryClin}
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Section 3: Bottom Row ─────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Ranking por Bairro */}
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <GlassCard className="p-4 lg:p-6">
            <div className="mb-5">
              <h3 className="font-display text-base lg:text-lg font-semibold text-primary-dark">
                Ranking por Bairro
              </h3>
              <p className="text-xs lg:text-sm text-gray-300">
                Top 10 bairros com mais ocorrencias
              </p>
            </div>
            <div className="space-y-3">
              {sortedNeighborhoods.map((row, i) => {
                const pct = (row.total / maxNeighborhoodTotal) * 100
                return (
                  <motion.div
                    key={row.neighborhood}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                    className="flex items-center gap-2 lg:gap-3"
                  >
                    <span className="w-5 lg:w-6 text-xs lg:text-sm font-bold text-gray-200">
                      {i + 1}
                    </span>
                    <span className="w-20 xs:w-24 lg:w-32 shrink-0 truncate text-xs lg:text-sm font-medium text-primary-dark">
                      {row.neighborhood}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-shape">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary-light to-primary-clin"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          delay: 0.1 * i,
                          duration: 0.6,
                          ease: 'easeOut',
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold text-primary-dark">
                      {row.total}
                    </span>
                  </motion.div>
                )
              })}

              {sortedNeighborhoods.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-300">
                  Nenhum dado disponivel
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Tempo de Resposta */}
        <motion.div variants={cardVariants}>
          <GlassCard className="p-4 lg:p-6">
            <div className="mb-4">
              <h3 className="font-display text-base lg:text-lg font-semibold text-primary-dark">
                Tempo de Resposta
              </h3>
              <p className="text-xs lg:text-sm text-gray-300">Media em horas por mes</p>
            </div>
            <div className="h-[180px] lg:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTimeData}>
                <defs>
                  <linearGradient
                    id="areaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={COLORS.accentBase}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor={COLORS.accentBase}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.05)"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 9, fill: '#666666' }}
                  axisLine={{ stroke: '#EDE9F2' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#666666' }}
                  axisLine={false}
                  tickLine={false}
                  unit="h"
                  width={35}
                />
                <Tooltip content={<ResponseTimeTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avg_hours"
                  name="Media (h)"
                  stroke={COLORS.accentBase}
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  dot={{ fill: COLORS.accentBase, r: 3, strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: '#fff',
                    fill: COLORS.accentBase,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Section 4: Status Distribution Donut ──────────── */}
      {statusDonutData.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <motion.div variants={cardVariants}>
            <GlassCard className="p-4 lg:p-6">
              <h3 className="mb-4 font-display text-base lg:text-lg font-semibold text-primary-dark">
                Distribuicao por Status
              </h3>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusDonutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const item = payload[0]
                        return (
                          <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-glass backdrop-blur">
                            <p className="text-sm font-semibold text-primary-dark">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-300">
                              {item.value} ocorrencias
                            </p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-primary-dark">
                      {overview?.total ?? 0}
                    </p>
                    <p className="text-xs text-gray-300">total</p>
                  </div>
                </div>
              </div>
              <DonutLegend data={statusDonutData} />
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* ── Section 5: Heatmap ─────────────────────────── */}
      {!loading && heatmapData.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassCard className="p-4 lg:p-6">
            <div className="mb-4">
              <h3 className="font-display text-base lg:text-lg font-semibold tracking-tight text-primary-dark">
                Mapa de Calor
              </h3>
              <p className="text-xs lg:text-sm text-gray-300">
                Concentração de ocorrências por região — {heatmapData.length.toLocaleString('pt-BR')} áreas mapeadas
              </p>
            </div>
            <div
              ref={heatmapContainerRef}
              className="h-[300px] lg:h-[480px] rounded-xl overflow-hidden"
              style={{ background: '#0A2E2E' }}
            />
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-[10px] text-gray-300">Baixo</span>
              <div className="flex h-2 w-32 rounded-full overflow-hidden">
                <div className="flex-1" style={{ background: '#155B5B' }} />
                <div className="flex-1" style={{ background: '#268C8C' }} />
                <div className="flex-1" style={{ background: '#579D67' }} />
                <div className="flex-1" style={{ background: '#F59E0B' }} />
                <div className="flex-1" style={{ background: '#EF4444' }} />
              </div>
              <span className="text-[10px] text-gray-300">Alto</span>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
