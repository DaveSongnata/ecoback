import type {
  AuthResponse,
  BiCategoryRow,
  BiNeighborhoodRow,
  BiOverview,
  BiPeriodRow,
  BiResponseTimeRow,
  HeatmapPoint,
  Occurrence,
  PaginatedResponse,
  Staff,
} from '@/types'

/* ── Config ──────────────────────────────────────────────── */

const BASE_URL = ''
const TOKEN_KEY = 'eco_token'

/* ── Token helpers ───────────────────────────────────────── */

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/* ── Core fetch wrapper ──────────────────────────────────── */

async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const errors = (body as { errors?: { message: string }[] }).errors
    throw new Error(errors?.[0]?.message ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/* ── Auth ────────────────────────────────────────────────── */

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await api<AuthResponse>('/web/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api<void>('/web/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}

export async function getMe(): Promise<Staff> {
  return api<Staff>('/web/me')
}

/* ── Staff ───────────────────────────────────────────────── */

export async function getStaff(): Promise<Staff[]> {
  const res = await api<{ data: Staff[] }>('/web/staff')
  return res.data
}

export async function createStaff(
  data: { name: string; email: string; password: string; permissions: string[] },
): Promise<Staff> {
  return api<Staff>('/web/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStaff(
  id: string,
  data: Partial<{ name: string; email: string; password: string; is_active: boolean }>,
): Promise<Staff> {
  return api<Staff>(`/web/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteStaff(id: string): Promise<void> {
  return api<void>(`/web/staff/${id}`, { method: 'DELETE' })
}

export async function restoreStaff(id: string): Promise<Staff> {
  return api<Staff>(`/web/staff/${id}/restore`, { method: 'POST' })
}

export async function updateStaffPermissions(
  id: string,
  permissions: string[],
): Promise<Staff> {
  return api<Staff>(`/web/staff/${id}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  })
}

/* ── Occurrences ─────────────────────────────────────────── */

export async function getOccurrences(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<Occurrence>> {
  const search = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        search.set(key, String(value))
      }
    }
  }
  const qs = search.toString()
  return api<PaginatedResponse<Occurrence>>(
    `/web/occurrences${qs ? `?${qs}` : ''}`,
  )
}

export async function getNextForTriage(): Promise<Occurrence | null> {
  const res = await api<{ data: Occurrence | null }>('/web/occurrences/next')
  return res.data
}

export async function getOccurrence(id: string): Promise<Occurrence> {
  return api<Occurrence>(`/web/occurrences/${id}`)
}

export async function approveOccurrence(
  id: string,
  data: {
    notice: string
    scheduled_date: string
    scheduled_time?: string
    team_name: string
  },
): Promise<Occurrence> {
  return api<Occurrence>(`/web/occurrences/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function rejectOccurrence(
  id: string,
  data: { rejection_reason: string },
): Promise<Occurrence> {
  return api<Occurrence>(`/web/occurrences/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function completeOccurrence(
  id: string,
  data?: { notice?: string },
): Promise<Occurrence> {
  return api<Occurrence>(`/web/occurrences/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(data ?? {}),
  })
}

/* ── BI ──────────────────────────────────────────────────── */

export async function getBiOverview(): Promise<BiOverview> {
  return api<BiOverview>('/web/bi/overview')
}

export async function getBiByCategory(): Promise<BiCategoryRow[]> {
  const res = await api<{ data: BiCategoryRow[] }>('/web/bi/by-category')
  return res.data
}

export async function getBiByNeighborhood(
  cityId?: string,
): Promise<BiNeighborhoodRow[]> {
  const qs = cityId ? `?city_id=${cityId}` : ''
  const res = await api<{ data: BiNeighborhoodRow[] }>(`/web/bi/by-neighborhood${qs}`)
  return res.data
}

export async function getBiByPeriod(months?: number): Promise<BiPeriodRow[]> {
  const qs = months ? `?months=${months}` : ''
  const res = await api<{ data: BiPeriodRow[] }>(`/web/bi/by-period${qs}`)
  return res.data
}

export async function getBiResponseTime(): Promise<BiResponseTimeRow[]> {
  const res = await api<{ data: BiResponseTimeRow[] }>('/web/bi/response-time')
  return res.data
}

export async function getBiHeatmap(): Promise<HeatmapPoint[]> {
  const res = await api<{ data: HeatmapPoint[] }>('/web/bi/heatmap')
  return res.data
}

/* ── Export ───────────────────────────────────────────────── */

export async function exportPdf(
  occurrenceIds: string[],
): Promise<Occurrence[]> {
  const res = await api<{ data: Occurrence[] }>('/web/export/pdf', {
    method: 'POST',
    body: JSON.stringify({ occurrence_ids: occurrenceIds }),
  })
  return res.data
}

/* ── Lookups ─────────────────────────────────────────────── */

export async function getCities(): Promise<{ id: string; name: string }[]> {
  return api<{ id: string; name: string }[]>('/web/cities')
}

export async function getCategories(): Promise<
  { id: string; slug: string; name: string }[]
> {
  return api<{ id: string; slug: string; name: string }[]>(
    '/web/occurrence-categories',
  )
}
