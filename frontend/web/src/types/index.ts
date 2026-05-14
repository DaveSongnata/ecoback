/* ── Permissions ─────────────────────────────────────────── */

export type Permission =
  | 'occurrences:triage'
  | 'occurrences:export'
  | 'bi:view'
  | 'staff:manage'

/* ── Staff ───────────────────────────────────────────────── */

export interface Staff {
  id: string
  name: string
  email: string
  is_active: boolean
  permissions: string[]
  created_at: string
}

/* ── Occurrence ──────────────────────────────────────────── */

export type OccurrenceStatus =
  | 'em_analise'
  | 'aprovada'
  | 'cancelada'
  | 'concluida'

export interface OccurrenceResponse {
  notice: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  team_name: string | null
  staff_id: string | null
  rejection_reason: string | null
  responded_at: string | null
}

export interface Occurrence {
  id: string
  protocol: string
  status: OccurrenceStatus
  city: { id: number; name: string; ibge_code: string } | null
  category: { id: number; slug: string; name: string } | null
  cep: string | null
  neighborhood: string | null
  street: string | null
  address: string | null
  observation: string | null
  photos: { position: number; url: string }[]
  coordinates: { position: number; lat: number; lng: number }[]
  response: OccurrenceResponse | null
  user: { id: number; email: string; phone: string } | null
  created_at: string
  updated_at: string
}

/* ── BI ──────────────────────────────────────────────────── */

export interface StatusBreakdown {
  em_analise: number
  aprovada: number
  cancelada: number
  concluida: number
}

export interface BiOverview {
  total: number
  by_status: StatusBreakdown
  avg_response_hours: number
}

export interface BiCategoryRow {
  slug: string
  name: string
  total: number
  by_status: StatusBreakdown
}

export interface BiNeighborhoodRow {
  neighborhood: string
  total: number
  by_status: StatusBreakdown
}

export interface BiPeriodRow {
  period: string
  total: number
  by_status: StatusBreakdown
}

export interface BiResponseTimeRow {
  period: string
  avg_hours: number
  total: number
}

export interface HeatmapPoint {
  lat: number
  lng: number
  status: OccurrenceStatus
}

/* ── Pagination ──────────────────────────────────────────── */

export interface PaginatedResponse<T> {
  meta: {
    page: number
    per_page: number
    total: number
  }
  data: T[]
}

/* ── Auth ────────────────────────────────────────────────── */

export interface AuthResponse {
  token: string
  staff: {
    id: string
    name: string
    email: string
    permissions: string[]
  }
}
