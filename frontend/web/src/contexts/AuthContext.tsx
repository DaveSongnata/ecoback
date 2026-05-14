import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Permission, Staff } from '@/types'
import {
  getMe,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  setToken,
  clearToken,
} from '@/services/api'

/* ── Context shape ───────────────────────────────────────── */

interface AuthContextValue {
  staff: Staff | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ── Provider ────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken)
  const [loading, setLoading] = useState(true)

  // Validate existing token on mount
  useEffect(() => {
    const storedToken = getToken()
    if (!storedToken) {
      setLoading(false)
      return
    }

    getMe()
      .then((me) => {
        setStaff(me)
        setTokenState(storedToken)
      })
      .catch(() => {
        clearToken()
        setStaff(null)
        setTokenState(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    setToken(response.token)
    setTokenState(response.token)

    // Fetch full staff profile after login
    const me = await getMe()
    setStaff(me)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setStaff(null)
    setTokenState(null)
  }, [])

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!staff) return false
      return staff.permissions.includes(permission)
    },
    [staff],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      staff,
      token,
      loading,
      isAuthenticated: !!staff && !!token,
      login,
      logout,
      hasPermission,
    }),
    [staff, token, loading, login, logout, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ── Hook ────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
