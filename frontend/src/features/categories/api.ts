import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type { Category, CategoryInput, TransactionType } from '@/types/api'

const BASE = '/api/v1/categories'

export const categoriesApi = {
  list: (type?: TransactionType) => http.get<Category[]>(BASE, { type }),
  create: (input: CategoryInput) => http.post<Category>(BASE, input),
  update: (id: string, input: Omit<CategoryInput, 'type'>) => http.put<Category>(`${BASE}/${id}`, input),
  remove: (id: string) => http.delete(`${BASE}/${id}`),
}

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: queryKeys.categories.byType(type),
    queryFn: () => categoriesApi.list(type),
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
      id ? categoriesApi.update(id, input) : categoriesApi.create(input),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategoryViews()
  return useMutation({ mutationFn: categoriesApi.remove, onSuccess: invalidate })
}
