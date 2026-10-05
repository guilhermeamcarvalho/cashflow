import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRecurring, deleteRecurring, listRecurring, updateRecurring } from '@/data/recurring'
import { queryKeys } from '@/lib/queryKeys'
import type { RecurringTransactionInput } from '@/types/api'

export function useRecurringTransactions() {
  return useQuery({
    queryKey: queryKeys.recurring.all,
    queryFn: listRecurring,
  })
}

/** Criar/editar um fixo pode gerar lançamentos: atualiza listas, orçamentos e dashboard. */
function useInvalidateRecurringViews() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all }),
    ])
}

export function useSaveRecurring() {
  const invalidate = useInvalidateRecurringViews()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: RecurringTransactionInput }) =>
      id ? updateRecurring(id, input) : createRecurring(input),
    onSuccess: invalidate,
  })
}

export function useDeleteRecurring() {
  const invalidate = useInvalidateRecurringViews()
  return useMutation({ mutationFn: deleteRecurring, onSuccess: invalidate })
}
