import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/* ── Route → title mapping ──────────────────────────────── */

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/triage': 'Triagem',
  '/occurrences': 'Ocorrencias',
  '/staff': 'Equipe',
}

function resolveTitle(pathname: string): string {
  // Exact match first
  if (routeTitles[pathname]) return routeTitles[pathname]

  // Try matching the first segment (e.g. /occurrences/123)
  const base = '/' + pathname.split('/').filter(Boolean)[0]
  return routeTitles[base] ?? 'EcoAmazonia'
}

/* ── Component ──────────────────────────────────────────── */

export function AppLayout() {
  const { pathname } = useLocation()
  const title = resolveTitle(pathname)

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col ml-[260px]">
        <TopBar title={title} />

        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
