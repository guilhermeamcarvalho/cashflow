import type { ProblemDetail } from '@/types/api'
import { getToken } from './session'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** Erro de API com o corpo Problem Details já interpretado. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? 'Erro inesperado')
    this.name = 'ApiError'
    this.status = problem.status
    this.fieldErrors = problem.errors ?? {}
  }
}

type Query = Record<string, string | number | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Query
  signal?: AbortSignal
}

let unauthorizedHandler: (() => void) | null = null

/** Registrado pelo AuthProvider: chamado quando a API responde 401. */
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

/** Cliente HTTP único da aplicação: JSON, token Bearer e erros padronizados. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError({ status: 0, detail: 'Não foi possível conectar ao servidor' })
  }

  if (response.status === 401 && token) unauthorizedHandler?.()

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetail | null
    throw new ApiError({
      status: response.status,
      ...problem,
      detail: problem?.detail ?? (response.status === 401 ? 'Sessão expirada' : response.statusText),
    })
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
