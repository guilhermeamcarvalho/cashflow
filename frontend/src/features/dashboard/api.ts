import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type {
  DailyTotals,
  DailyTotalsQuery,
  MonthlySummary,
  MonthlyTotals,
  MonthlyTotalsQuery,
  YearMonth,
} from '@/types/api'

export const dashboardApi = {
  summary: (month: YearMonth, signal?: AbortSignal) =>
    http.get<MonthlySummary>('/api/v1/dashboard/summary', { month }, signal),
  monthlyTotals: (query: MonthlyTotalsQuery, signal?: AbortSignal) =>
    http.get<MonthlyTotals>('/api/v1/dashboard/monthly-totals', { ...query }, signal),
  dailyTotals: (query: DailyTotalsQuery, signal?: AbortSignal) =>
    http.get<DailyTotals>('/api/v1/dashboard/daily-totals', { ...query }, signal),
}

export function useMonthlySummary(month: YearMonth) {
  return useQuery({
    queryKey: queryKeys.dashboard.month(month),
    queryFn: ({ signal }) => dashboardApi.summary(month, signal),
    placeholderData: keepPreviousData,
  })
}

export function useMonthlyTotals(query: MonthlyTotalsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.monthlyTotals(query),
    queryFn: ({ signal }) => dashboardApi.monthlyTotals(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useDailyTotals(query: DailyTotalsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.dailyTotals(query),
    queryFn: ({ signal }) => dashboardApi.dailyTotals(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}
