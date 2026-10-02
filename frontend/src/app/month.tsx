import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { addMonths, currentMonth } from '@/lib/month'
import type { YearMonth } from '@/types/api'

interface MonthContextValue {
  month: YearMonth
  setMonth: (month: YearMonth) => void
  next: () => void
  previous: () => void
  isCurrent: boolean
}

const MonthContext = createContext<MonthContextValue | null>(null)

/** Mês de referência compartilhado por todas as telas (dashboard, lançamentos, orçamentos). */
export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState<YearMonth>(() => currentMonth())

  const value = useMemo<MonthContextValue>(
    () => ({
      month,
      setMonth,
      next: () => setMonth((m) => addMonths(m, 1)),
      previous: () => setMonth((m) => addMonths(m, -1)),
      isCurrent: month === currentMonth(),
    }),
    [month],
  )

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth(): MonthContextValue {
  const context = useContext(MonthContext)
  if (!context) throw new Error('useMonth deve ser usado dentro de <MonthProvider>')
  return context
}
