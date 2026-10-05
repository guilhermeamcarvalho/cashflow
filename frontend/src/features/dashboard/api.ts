import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dailyTotals, monthlySummary, monthlyTotals } from '@/data/dashboard'
import { queryKeys } from '@/lib/queryKeys'
import type { DailyTotalsQuery, MonthlyTotalsQuery, YearMonth } from '@/types/api'

export function useMonthlySummary(month: YearMonth) {
  return useQuery({
    queryKey: queryKeys.dashboard.month(month),
    queryFn: () => monthlySummary(month),
    placeholderData: keepPreviousData,
  })
}

export function useMonthlyTotals(query: MonthlyTotalsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.monthlyTotals(query),
    queryFn: () => monthlyTotals(query),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useDailyTotals(query: DailyTotalsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.dailyTotals(query),
    queryFn: () => dailyTotals(query),
    placeholderData: keepPreviousData,
    enabled,
  })
}
