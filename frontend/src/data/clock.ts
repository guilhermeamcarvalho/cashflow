import type { YearMonth } from '@/types/api'
import { toIsoDate, toYearMonth } from '@/lib/month'

/** Relógio da camada de dados: define "hoje" (faturas, lançamentos fixos). Substituível nos testes. */
let now: () => Date = () => new Date()

export function setClock(fn: () => Date): void {
  now = fn
}

export const today = (): string => toIsoDate(now())

export const thisMonth = (): YearMonth => toYearMonth(now())

export const timestamp = (): string => now().toISOString()

export const newId = (): string => crypto.randomUUID()
