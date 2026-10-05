import type { CreditCard, InvoiceStatus, PaymentMethod, YearMonth } from '@/types/api'
import { addMonths, dayIn } from './month'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  CASH: 'Dinheiro',
  BOLETO: 'Boleto',
}

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  OVERDUE: 'Vencida',
  PAID: 'Paga',
}

/**
 * Fatura (mês de vencimento) de uma compra — regra usada ao gravar os lançamentos: compras antes
 * do dia de fechamento entram na fatura que fecha no mês; a partir dele, na
 * seguinte. Se o vencimento é depois do fechamento, vence no mesmo mês.
 */
export function invoiceFor(card: Pick<CreditCard, 'closingDay' | 'dueDay'>, isoDate: string): YearMonth {
  const month = isoDate.slice(0, 7)
  const closingMonth = isoDate < dayIn(month, card.closingDay) ? month : addMonths(month, 1)
  return card.dueDay > card.closingDay ? closingMonth : addMonths(closingMonth, 1)
}

export function dueDateOf(card: Pick<CreditCard, 'dueDay'>, invoice: YearMonth): string {
  return dayIn(invoice, card.dueDay)
}

/** Data de fechamento da fatura que vence em `invoice`. */
export function closingDateOf(card: Pick<CreditCard, 'closingDay' | 'dueDay'>, invoice: YearMonth): string {
  return dayIn(card.dueDay > card.closingDay ? invoice : addMonths(invoice, -1), card.closingDay)
}
