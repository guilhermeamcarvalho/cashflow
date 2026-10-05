import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '@/data/transactions'
import { queryKeys } from '@/lib/queryKeys'
import type { TransactionInput, TransactionQuery } from '@/types/api'

export function useTransactions(query: TransactionQuery) {
  return useQuery({
    queryKey: queryKeys.transactions.list(query),
    queryFn: () => listTransactions(query),
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
      id ? updateTransaction(id, input) : createTransaction(input),
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoneyViews()
  return useMutation({
    mutationFn: ({ id, allInstallments }: { id: string; allInstallments?: boolean }) =>
      deleteTransaction(id, allInstallments),
    onSuccess: invalidate,
  })
}
