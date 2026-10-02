import type { YearMonth } from '@/types/api'

/** Utilitários para o mês de referência (`YYYY-MM`), sem dependências de fuso. */

export function toYearMonth(date: Date): YearMonth {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonth(now: Date = new Date()): YearMonth {
  return toYearMonth(now)
}

export function addMonths(month: YearMonth, amount: number): YearMonth {
  const [year, m] = month.split('-').map(Number)
  return toYearMonth(new Date(year, m - 1 + amount, 1))
}

export function daysInMonth(month: YearMonth): number {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m, 0).getDate()
}

/** Data padrão para um novo lançamento: hoje, se estiver no mês; senão, o dia 1. */
export function defaultDateFor(month: YearMonth, now: Date = new Date()): string {
  return month === toYearMonth(now) ? toIsoDate(now) : `${month}-01`
}

export function toIsoDate(date: Date): string {
  return `${toYearMonth(date)}-${String(date.getDate()).padStart(2, '0')}`
}

/** Converte `YYYY-MM-DD` em Date local (sem deslocamento de fuso). */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Compara dois meses `YYYY-MM` (negativo se a < b). */
export function compareMonths(a: YearMonth, b: YearMonth): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Quantidade de meses no intervalo fechado [from, to]. */
export function monthsBetween(from: YearMonth, to: YearMonth): number {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm) + 1
}

export function minMonth(a: YearMonth, b: YearMonth): YearMonth {
  return compareMonths(a, b) <= 0 ? a : b
}

export function maxMonth(a: YearMonth, b: YearMonth): YearMonth {
  return compareMonths(a, b) >= 0 ? a : b
}
