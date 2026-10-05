import type { Category, CreditCardRef, RecurringTransaction, Transaction } from '@/types/api'
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

/** Mais recentes primeiro (data e, no mesmo dia, criação). */
export function byNewest(a: TransactionRecord, b: TransactionRecord): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
}
