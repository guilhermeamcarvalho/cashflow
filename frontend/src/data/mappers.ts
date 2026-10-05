import type { Category, CreditCardRef, RecurringTransaction, Transaction, YearMonth } from '@/types/api'
import { dueDateOf } from '@/lib/creditCard'
import { addMonths, dayIn } from '@/lib/month'
import { notFound } from './errors'
import { fromCents } from './money'
import type { CategoryRecord, CreditCardRecord, Database, RecurringRecord, TransactionRecord } from './schema'

/** Conversão dos registros internos para os tipos que as telas consomem. */

export function toCategory(record: CategoryRecord): Category {
  return { id: record.id, name: record.name, type: record.type, color: record.color, icon: record.icon }
}

export function toCardRef(record: CreditCardRecord | undefined): CreditCardRef | null {
  return record ? { id: record.id, name: record.name, color: record.color } : null
}

export function findCategory(db: Database, id: string): CategoryRecord {
  const category = db.categories.find((c) => c.id === id)
  if (!category) throw notFound('Categoria')
  return category
}

export function findCard(db: Database, id: string): CreditCardRecord {
  const card = db.creditCards.find((c) => c.id === id)
  if (!card) throw notFound('Cartão')
  return card
}

const cardOf = (db: Database, id: string | null) => (id ? db.creditCards.find((c) => c.id === id) : undefined)

export function toTransaction(db: Database, record: TransactionRecord): Transaction {
  return {
    id: record.id,
    type: record.type,
    description: record.description,
    amount: fromCents(record.amount),
    date: record.date,
    paymentDate: paymentDateOf(db, record),
    notes: record.notes,
    category: toCategory(findCategory(db, record.categoryId)),
    paymentMethod: record.paymentMethod,
    creditCard: toCardRef(cardOf(db, record.creditCardId)),
    invoiceMonth: record.invoiceMonth,
    installmentGroupId: record.installmentGroupId,
    installmentNumber: record.installmentNumber,
    installmentCount: record.installmentCount,
    recurringId: record.recurringId,
    createdAt: record.createdAt,
  }
}

export function toRecurring(db: Database, record: RecurringRecord): RecurringTransaction {
  return {
    id: record.id,
    type: record.type,
    description: record.description,
    amount: fromCents(record.amount),
    dayOfMonth: record.dayOfMonth,
    startMonth: record.startMonth,
    nextDate: dayIn(nextMonthOf(record), record.dayOfMonth),
    notes: record.notes,
    category: toCategory(findCategory(db, record.categoryId)),
    paymentMethod: record.paymentMethod,
    creditCard: toCardRef(cardOf(db, record.creditCardId)),
  }
}

/** Próximo mês que o lançamento fixo ainda vai gerar. */
export function nextMonthOf(record: RecurringRecord): string {
  return record.generatedThrough ? addMonths(record.generatedThrough, 1) : record.startMonth
}

/**
 * Mês em que o lançamento pesa no caixa: o da fatura, nas compras no crédito
 * (a compra de 06/10 numa fatura que vence em novembro conta em novembro);
 * senão, o da própria data.
 */
export const paymentMonthOf = (record: TransactionRecord): YearMonth => record.invoiceMonth ?? record.date.slice(0, 7)

/** Dia em que o lançamento pesa no caixa: o vencimento da fatura, no crédito; senão, a própria data. */
export function paymentDateOf(db: Database, record: TransactionRecord): string {
  if (!record.invoiceMonth) return record.date
  const card = cardOf(db, record.creditCardId)
  return card ? dueDateOf(card, record.invoiceMonth) : `${record.invoiceMonth}-01`
}

const newestFirst = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0)

/** Mais recentes primeiro pela data da compra (e, no mesmo dia, pela criação). */
export function byNewest(a: TransactionRecord, b: TransactionRecord): number {
  return newestFirst(a.date, b.date) || newestFirst(a.createdAt, b.createdAt)
}

/** Ordenação das listas por mês: data de pagamento, depois data da compra e criação. */
export function byPaymentDate(db: Database): (a: TransactionRecord, b: TransactionRecord) => number {
  const dates = new Map<string, string>()
  const dateOf = (t: TransactionRecord) => {
    let date = dates.get(t.id)
    if (!date) dates.set(t.id, (date = paymentDateOf(db, t)))
    return date
  }
  return (a, b) => newestFirst(dateOf(a), dateOf(b)) || byNewest(a, b)
}
