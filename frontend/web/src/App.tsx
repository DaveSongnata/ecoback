import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import type { Permission } from '@/types'

/* ── Lazy-loaded pages ───────────────────────────────────── */

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const BiPage = lazy(() => import('@/pages/BiPage'))
const TriagePage = lazy(() => import('@/pages/TriagePage'))
const OccurrencesPage = lazy(() => import('@/pages/OccurrencesPage'))
const StaffPage = lazy(() => import('@/pages/StaffPage'))

/* ── Loading fallback ────────────────────────────────────── */

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-base/20 border-t-primary-base" />
    </div>
  )
}

/* ── Protected route wrapper ─────────────────────────────── */

function ProtectedRoute({
  permission,
  children,
}: {
  permission?: Permission
  children?: React.ReactNode
}) {
  const { isAuthenticated, loading, hasPermission } = useAuth()

  if (loading) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(permission)) {
    return <ForbiddenPage />
  }

  return children ? <>{children}</> : <Outlet />
}

/* ── 403 page ────────────────────────────────────────────── */

function ForbiddenPage() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="text-5xl font-bold text-gray-200">403</span>
      <p className="text-lg text-gray-300">
        Sem permissao para acessar esta pagina.
      </p>
      <a href="/" className="btn-primary mt-4">
        Voltar ao inicio
      </a>
    </div>
  )
}

/* ── Authenticated layout shell ──────────────────────────── */

const AppLayout = lazy(() =>
  import('@/components/layout/AppLayout').then((m) => ({ default: m.AppLayout }))
)

function AuthenticatedLayout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <Suspense fallback={<PageLoader />}>
      <AppLayout />
    </Suspense>
  )
}

/* ── Smart index redirect ────────────────────────────────── */

function IndexRedirect() {
  const { hasPermission } = useAuth()

  if (hasPermission('bi:view')) {
    return <Navigate to="/dashboard" replace />
  }
  if (hasPermission('occurrences:triage')) {
    return <Navigate to="/triage" replace />
  }
  // Fallback: send to dashboard even if no explicit permission
  return <Navigate to="/dashboard" replace />
}

/* ── Public route (redirect if already authenticated) ────── */

function PublicRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

/* ── App ─────────────────────────────────────────────────── */

export function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected */}
          <Route element={<AuthenticatedLayout />}>
            <Route index element={<IndexRedirect />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute permission="bi:view">
                  <BiPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/triage"
              element={
                <ProtectedRoute permission="occurrences:triage">
                  <TriagePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/occurrences"
              element={
                <ProtectedRoute permission="occurrences:triage">
                  <OccurrencesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute permission="staff:manage">
                  <StaffPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
