import type { AuthResponse } from '@/types/api'

/**
 * Persistência da sessão no navegador. Fica isolada aqui para que trocar a
 * estratégia (ex.: cookie httpOnly) não afete o resto da aplicação.
 */
const KEY = 'cashflow.session'

export function loadSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthResponse
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null
  } catch {
    return null
  }
}

export function saveSession(session: AuthResponse): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // armazenamento indisponível (modo privado): a sessão vale só nesta aba
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignorado
  }
}

export function getToken(): string | null {
  return loadSession()?.token ?? null
}
