import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type { RecurringTransaction, RecurringTransactionInput } from '@/types/api'

const BASE = '/api/v1/recurring-transactions'

export const recurringApi = {
  list: (signal?: AbortSignal) => http.get<RecurringTransaction[]>(BASE, undefined, signal),
  create: (input: RecurringTransactionInput) => http.post<RecurringTransaction>(BASE, input),
  update: (id: string, input: RecurringTransactionInput) => http.put<RecurringTransaction>(`${BASE}/${id}`, input),
  remove: (id: string) => http.delete(`${BASE}/${id}`),
}

export function useRecurringTransactions() {
  return useQuery({
    queryKey: queryKeys.recurring.all,
    queryFn: ({ signal }) => recurringApi.list(signal),
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
      id ? recurringApi.update(id, input) : recurringApi.create(input),
    onSuccess: invalidate,
  })
}

export function useDeleteRecurring() {
  const invalidate = useInvalidateRecurringViews()
  return useMutation({ mutationFn: recurringApi.remove, onSuccess: invalidate })
}
