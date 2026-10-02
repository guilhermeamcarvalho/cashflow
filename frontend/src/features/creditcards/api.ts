import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, request } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type { CreditCard, CreditCardInput, Invoice, InvoiceSummary, YearMonth } from '@/types/api'

const BASE = '/api/v1/credit-cards'

export const creditCardsApi = {
  list: (signal?: AbortSignal) => http.get<CreditCard[]>(BASE, undefined, signal),
  create: (input: CreditCardInput) => http.post<CreditCard>(BASE, input),
  update: (id: string, input: CreditCardInput) => http.put<CreditCard>(`${BASE}/${id}`, input),
  remove: (id: string) => http.delete(`${BASE}/${id}`),
  invoice: (id: string, month: YearMonth, signal?: AbortSignal) =>
    http.get<Invoice>(`${BASE}/${id}/invoices/${month}`, undefined, signal),
  pay: (id: string, month: YearMonth) => http.put<InvoiceSummary>(`${BASE}/${id}/invoices/${month}/payment`),
  unpay: (id: string, month: YearMonth) =>
    request<InvoiceSummary>(`${BASE}/${id}/invoices/${month}/payment`, { method: 'DELETE' }),
}

export function useCreditCards() {
  return useQuery({
    queryKey: queryKeys.creditCards.all,
    queryFn: ({ signal }) => creditCardsApi.list(signal),
  })
}

export function useInvoice(cardId: string | undefined, month: YearMonth) {
  return useQuery({
    queryKey: queryKeys.creditCards.invoice(cardId ?? '', month),
    queryFn: ({ signal }) => creditCardsApi.invoice(cardId!, month, signal),
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
      id ? creditCardsApi.update(id, input) : creditCardsApi.create(input),
    onSuccess: invalidate,
  })
}

export function useDeleteCreditCard() {
  const invalidate = useInvalidateCards()
  return useMutation({ mutationFn: creditCardsApi.remove, onSuccess: invalidate })
}

export function useInvoicePayment() {
  const invalidate = useInvalidateCards()
  return useMutation({
    mutationFn: ({ cardId, month, paid }: { cardId: string; month: YearMonth; paid: boolean }) =>
      paid ? creditCardsApi.pay(cardId, month) : creditCardsApi.unpay(cardId, month),
    onSuccess: invalidate,
  })
}
