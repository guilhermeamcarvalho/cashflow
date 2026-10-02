import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type { Page, Transaction, TransactionInput, TransactionQuery } from '@/types/api'

const BASE = '/api/v1/transactions'

export const transactionsApi = {
  list: (query: TransactionQuery, signal?: AbortSignal) =>
    http.get<Page<Transaction>>(BASE, { ...query }, signal),
  create: (input: TransactionInput) => http.post<Transaction>(BASE, input),
  update: (id: string, input: TransactionInput) => http.put<Transaction>(`${BASE}/${id}`, input),
  remove: (id: string, allInstallments = false) =>
    http.delete(`${BASE}/${id}${allInstallments ? '?allInstallments=true' : ''}`),
}

export function useTransactions(query: TransactionQuery) {
  return useQuery({
    queryKey: queryKeys.transactions.list(query),
    queryFn: ({ signal }) => transactionsApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
}

/** Lançamentos alteram listas, orçamentos (gasto), o dashboard e as faturas. */
function useInvalidateMoneyViews() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all }),
    ])
}

export function useSaveTransaction() {
  const invalidate = useInvalidateMoneyViews()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TransactionInput }) =>
      id ? transactionsApi.update(id, input) : transactionsApi.create(input),
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoneyViews()
  return useMutation({
    mutationFn: ({ id, allInstallments }: { id: string; allInstallments?: boolean }) =>
      transactionsApi.remove(id, allInstallments),
    onSuccess: invalidate,
  })
}
