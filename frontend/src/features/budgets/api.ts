import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type { Budget, BudgetInput, BudgetOverview, YearMonth } from '@/types/api'

const BASE = '/api/v1/budgets'

export const budgetsApi = {
  overview: (month: YearMonth, signal?: AbortSignal) => http.get<BudgetOverview>(BASE, { month }, signal),
  upsert: (input: BudgetInput) => http.put<Budget>(BASE, input),
  copy: (fromMonth: YearMonth, toMonth: YearMonth) => http.post<BudgetOverview>(`${BASE}/copy`, { fromMonth, toMonth }),
  remove: (id: string) => http.delete(`${BASE}/${id}`),
}

export function useBudgets(month: YearMonth) {
  return useQuery({
    queryKey: queryKeys.budgets.month(month),
    queryFn: ({ signal }) => budgetsApi.overview(month, signal),
  })
}

function useInvalidateBudgetViews() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ])
}

export function useSaveBudget() {
  const invalidate = useInvalidateBudgetViews()
  return useMutation({ mutationFn: budgetsApi.upsert, onSuccess: invalidate })
}

export function useCopyBudgets() {
  const invalidate = useInvalidateBudgetViews()
  return useMutation({
    mutationFn: ({ from, to }: { from: YearMonth; to: YearMonth }) => budgetsApi.copy(from, to),
    onSuccess: invalidate,
  })
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgetViews()
  return useMutation({ mutationFn: budgetsApi.remove, onSuccess: invalidate })
}
