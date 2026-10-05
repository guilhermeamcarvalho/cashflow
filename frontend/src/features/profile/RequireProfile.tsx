import { Navigate, Outlet } from 'react-router'
import { useProfile } from './ProfileContext'

/** Rotas do app: no primeiro acesso, vai para as boas-vindas. */
export function RequireProfile() {
  const { profile } = useProfile()
  if (!profile) return <Navigate to="/welcome" replace />
  return <Outlet />
}

/** Boas-vindas: com o perfil já criado, vai direto ao app. */
export function FirstAccessOnly() {
  const { profile } = useProfile()
  if (profile) return <Navigate to="/" replace />
  return <Outlet />
}
