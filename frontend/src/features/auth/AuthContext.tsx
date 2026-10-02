import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthorized } from '@/lib/http'
import { clearSession, loadSession, saveSession } from '@/lib/session'
import type { AuthResponse, User } from '@/types/api'
import { authApi, type LoginInput, type RegisterInput } from './api'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Mantém a sessão (JWT + usuário) e expõe login, cadastro e logout. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<AuthResponse | null>(loadSession)

  const start = useCallback((next: AuthResponse) => {
    saveSession(next)
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  // Qualquer 401 da API encerra a sessão.
  useEffect(() => {
    onUnauthorized(logout)
    return () => onUnauthorized(null)
  }, [logout])

  // Encerra a sessão automaticamente quando o token expira.
  useEffect(() => {
    if (!session) return
    const remaining = new Date(session.expiresAt).getTime() - Date.now()
    const MAX_TIMEOUT = 2 ** 31 - 1 // limite do setTimeout
    const timer = window.setTimeout(logout, Math.min(Math.max(remaining, 0), MAX_TIMEOUT))
    return () => window.clearTimeout(timer)
  }, [session, logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login: async (input) => start(await authApi.login(input)),
      register: async (input) => start(await authApi.register(input)),
      logout,
      updateUser: (user) => session && start({ ...session, user }),
    }),
    [session, start, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return context
}
