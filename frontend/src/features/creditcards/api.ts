import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCreditCard,
  deleteCreditCard,
  getInvoice,
  listCreditCards,
  markInvoicePaid,
  unmarkInvoicePaid,
  updateCreditCard,
} from '@/data/creditCards'
import { queryKeys } from '@/lib/queryKeys'
import type { CreditCardInput, YearMonth } from '@/types/api'

export function useCreditCards() {
  return useQuery({
    queryKey: queryKeys.creditCards.all,
    queryFn: listCreditCards,
  })
}

export function useInvoice(cardId: string | undefined, month: YearMonth) {
  return useQuery({
    queryKey: queryKeys.creditCards.invoice(cardId ?? '', month),
    queryFn: () => getInvoice(cardId!, month),
    enabled: Boolean(cardId),
    placeholderData: keepPreviousData,
  })
}

function useInvalidateCards() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all })
}

export function useSaveCreditCard() {
  const invalidate = useInvalidateCards()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreditCardInput }) =>
      id ? updateCreditCard(id, input) : createCreditCard(input),
    onSuccess: invalidate,
  })
}

export function useDeleteCreditCard() {
  const invalidate = useInvalidateCards()
  return useMutation({ mutationFn: deleteCreditCard, onSuccess: invalidate })
}

export function useInvoicePayment() {
  const invalidate = useInvalidateCards()
  return useMutation({
    mutationFn: ({ cardId, month, paid }: { cardId: string; month: YearMonth; paid: boolean }) =>
      paid ? markInvoicePaid(cardId, month) : unmarkInvoicePaid(cardId, month),
    onSuccess: invalidate,
  })
}
