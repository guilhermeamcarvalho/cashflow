import type { YearMonth } from '@/types/api'
import { parseIsoDate, toIsoDate } from './month'

const LOCALE = 'pt-BR'

const currency = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' })
const compactCurrency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const monthLabel = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const shortMonth = new Intl.DateTimeFormat(LOCALE, { month: 'short' })
const dayLabel = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short' })

export function formatCurrency(value: number): string {
  return currency.format(value)
}

export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value)
}

/** Valor com sinal explícito: +R$ 10,00 / −R$ 10,00. */
export function formatSigned(value: number, type: 'INCOME' | 'EXPENSE'): string {
  return `${type === 'INCOME' ? '+' : '−'}${currency.format(Math.abs(value))}`
}

export function formatMonth(month: YearMonth): string {
  const [year, m] = month.split('-').map(Number)
  const label = monthLabel.format(new Date(year, m - 1, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatShortMonth(month: YearMonth): string {
  const [year, m] = month.split('-').map(Number)
  return shortMonth.format(new Date(year, m - 1, 1)).replace('.', '')
}

/** "Hoje", "Ontem" ou "segunda-feira, 5 de outubro". */
export function formatDayHeading(isoDate: string, now: Date = new Date()): string {
  const today = toIsoDate(now)
  const yesterday = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  if (isoDate === today) return 'Hoje'
  if (isoDate === yesterday) return 'Ontem'
  const label = dayLabel.format(parseIsoDate(isoDate))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatShortDate(isoDate: string): string {
  return shortDate.format(parseIsoDate(isoDate)).replace('.', '')
}

/** Variação percentual entre dois valores (null quando não há base). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}
