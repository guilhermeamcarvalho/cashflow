import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategory, deleteCategory, listCategories, updateCategory } from '@/data/categories'
import { queryKeys } from '@/lib/queryKeys'
import type { CategoryInput, TransactionType } from '@/types/api'

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: queryKeys.categories.byType(type),
    queryFn: () => listCategories(type),
    staleTime: 5 * 60_000,
  })
}

/** Alterar categorias impacta listas, orçamentos e dashboard (nome/cor/ícone). */
function useInvalidateCategoryViews() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ])
}

export function useSaveCategory() {
  const invalidate = useInvalidateCategoryViews()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) =>
      id ? updateCategory(id, input) : createCategory(input),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategoryViews()
  return useMutation({ mutationFn: deleteCategory, onSuccess: invalidate })
}
