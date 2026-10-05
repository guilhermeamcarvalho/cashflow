import type { RecurringTransaction, RecurringTransactionInput, YearMonth } from '@/types/api'
import { invoiceFor } from '@/lib/creditCard'
import { addMonths, dayIn } from '@/lib/month'
import { newId, thisMonth, timestamp } from './clock'
import { businessRule, notFound } from './errors'
import { findCard, findCategory, nextMonthOf, toRecurring } from './mappers'
import { resolvePayment } from './creditCards'
import type { Database, RecurringRecord } from './schema'
import { read, write } from './store'
import { Validator } from './validation'

/**
 * Lançamentos fixos. Os lançamentos reais são gerados de forma preguiçosa:
 * antes das leituras de dados financeiros, {@link generateDue} lança tudo o que
 * venceu até o mês corrente. Assim não é preciso agendador.
 */

/** Gera os meses pendentes de um modelo até `through` (inclusive). */
function generate(db: Database, recurring: RecurringRecord, through: YearMonth): void {
  const card = recurring.creditCardId ? findCard(db, recurring.creditCardId) : null
  let month = nextMonthOf(recurring)
  if (month > through) return
  const createdAt = timestamp()
  for (; month <= through; month = addMonths(month, 1)) {
    const date = dayIn(month, recurring.dayOfMonth)
    db.transactions.push({
      id: newId(),
      type: recurring.type,
      categoryId: recurring.categoryId,
      description: recurring.description,
      amount: recurring.amount,
      date,
      notes: recurring.notes,
      paymentMethod: recurring.paymentMethod,
      creditCardId: recurring.creditCardId,
      invoiceMonth: card ? invoiceFor(card, date) : null,
      installmentGroupId: null,
      installmentNumber: null,
      installmentCount: null,
      recurringId: recurring.id,
      createdAt,
    })
    recurring.generatedThrough = month
  }
}

const hasPending = (db: Database, through: YearMonth) => db.recurring.some((r) => nextMonthOf(r) <= through)

/** Lança o que venceu até o mês corrente para todos os modelos. Só grava se houver algo a gerar. */
export async function generateDue(): Promise<void> {
  const current = thisMonth()
  if (!(await read((db) => hasPending(db, current)))) return
  await write((db) => db.recurring.forEach((recurring) => generate(db, recurring, current)))
}

export async function listRecurring(): Promise<RecurringTransaction[]> {
  await generateDue()
  return read((db) =>
    [...db.recurring]
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.description.localeCompare(b.description, 'pt-BR'))
      .map((r) => toRecurring(db, r)),
  )
}

function validate(input: RecurringTransactionInput) {
  const v = new Validator()
  const categoryId = v.required('categoryId', input.categoryId, 'Escolha uma categoria')
  const description = v.text(
    'description',
    input.description,
    140,
    'Informe a descrição',
    'A descrição deve ter no máximo 140 caracteres',
  )
  const amount = v.money('amount', input.amount)
  const dayOfMonth = v.integer('dayOfMonth', input.dayOfMonth, 1, 31, 'O dia deve estar entre 1 e 31')
  const startMonth = v.month('startMonth', input.startMonth, 'Informe o mês inicial')
  const notes = v.optionalText('notes', input.notes, 500, 'As observações devem ter no máximo 500 caracteres')
  v.check()
  return { categoryId, description, amount, dayOfMonth, startMonth, notes }
}

/** Cria o lançamento fixo e já lança os meses vencidos (inclusive o atual). */
export async function createRecurring(input: RecurringTransactionInput): Promise<RecurringTransaction> {
  const fields = validate(input)
  return write((db) => {
    const category = findCategory(db, fields.categoryId)
    const payment = resolvePayment(db, category.type, input.paymentMethod, input.creditCardId, `${fields.startMonth}-01`)
    const recurring: RecurringRecord = {
      id: newId(),
      type: category.type,
      ...fields,
      generatedThrough: null,
      paymentMethod: payment.paymentMethod,
      creditCardId: payment.creditCardId,
      createdAt: timestamp(),
    }
    db.recurring.push(recurring)
    generate(db, recurring, thisMonth())
    return toRecurring(db, recurring)
  })
}

/** Altera o modelo; vale para os próximos meses (lançamentos já gerados não mudam). */
export async function updateRecurring(id: string, input: RecurringTransactionInput): Promise<RecurringTransaction> {
  const fields = validate(input)
  return write((db) => {
    const recurring = findRecurring(db, id)
    const category = findCategory(db, fields.categoryId)
    if (category.type !== recurring.type) {
      throw businessRule('A categoria deve ser do mesmo tipo do lançamento fixo')
    }
    if (fields.startMonth !== recurring.startMonth && recurring.generatedThrough !== null) {
      throw businessRule('O mês inicial não pode mudar depois do primeiro lançamento')
    }
    const payment = resolvePayment(db, category.type, input.paymentMethod, input.creditCardId, `${fields.startMonth}-01`)
    Object.assign(recurring, fields, { paymentMethod: payment.paymentMethod, creditCardId: payment.creditCardId })
    generate(db, recurring, thisMonth())
    return toRecurring(db, recurring)
  })
}

/** Encerra o lançamento fixo. Os lançamentos já gerados permanecem no histórico, desvinculados. */
export function deleteRecurring(id: string): Promise<void> {
  return write((db) => {
    findRecurring(db, id)
    db.recurring = db.recurring.filter((r) => r.id !== id)
    for (const t of db.transactions) if (t.recurringId === id) t.recurringId = null
  })
}

function findRecurring(db: Database, id: string): RecurringRecord {
  const recurring = db.recurring.find((r) => r.id === id)
  if (!recurring) throw notFound('Lançamento fixo')
  return recurring
}
