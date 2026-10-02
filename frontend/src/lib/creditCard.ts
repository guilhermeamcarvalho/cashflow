import type { CreditCard, InvoiceStatus, PaymentMethod, YearMonth } from '@/types/api'
import { addMonths, parseIsoDate, toYearMonth } from './month'

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

function dayIn(month: YearMonth, day: number): string {
  const [year, m] = month.split('-').map(Number)
  const last = new Date(year, m, 0).getDate()
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`
}

/**
 * Fatura (mês de vencimento) de uma compra — mesma regra da API: compras antes
 * do dia de fechamento entram na fatura que fecha no mês; a partir dele, na
 * seguinte. Se o vencimento é depois do fechamento, vence no mesmo mês.
 */
export function invoiceFor(card: Pick<CreditCard, 'closingDay' | 'dueDay'>, isoDate: string): YearMonth {
  const month = toYearMonth(parseIsoDate(isoDate))
  const closingMonth = isoDate < dayIn(month, card.closingDay) ? month : addMonths(month, 1)
  return card.dueDay > card.closingDay ? closingMonth : addMonths(closingMonth, 1)
}

export function dueDateOf(card: Pick<CreditCard, 'dueDay'>, invoice: YearMonth): string {
  return dayIn(invoice, card.dueDay)
}
