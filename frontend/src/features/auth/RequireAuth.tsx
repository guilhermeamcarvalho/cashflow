import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

/** Protege as rotas internas: sem sessão, redireciona para o login. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Rotas públicas (login/cadastro): com sessão ativa, vai direto ao app. */
export function GuestOnly() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
