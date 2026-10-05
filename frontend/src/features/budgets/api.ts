import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetOverview, copyBudgets, deleteBudget, upsertBudget } from '@/data/budgets'
import { queryKeys } from '@/lib/queryKeys'
import type { YearMonth } from '@/types/api'

export function useBudgets(month: YearMonth) {
  return useQuery({
    queryKey: queryKeys.budgets.month(month),
    queryFn: () => budgetOverview(month),
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
  return useMutation({ mutationFn: upsertBudget, onSuccess: invalidate })
}

export function useCopyBudgets() {
  const invalidate = useInvalidateBudgetViews()
  return useMutation({
    mutationFn: ({ from, to }: { from: YearMonth; to: YearMonth }) => copyBudgets(from, to),
    onSuccess: invalidate,
  })
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgetViews()
  return useMutation({ mutationFn: deleteBudget, onSuccess: invalidate })
}
