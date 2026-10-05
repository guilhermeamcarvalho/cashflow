import type { Page, Transaction, TransactionInput, TransactionQuery } from '@/types/api'
import { addMonths, addMonthsToDate } from '@/lib/month'
import { newId, timestamp } from './clock'
import { businessRule, notFound } from './errors'
import { byNewest, findCategory, toTransaction } from './mappers'
import { resolvePayment } from './creditCards'
import { generateDue } from './recurring'
import type { Database, TransactionRecord } from './schema'
import { read, write } from './store'
import { Validator } from './validation'

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50

export async function listTransactions(query: TransactionQuery): Promise<Page<Transaction>> {
  await generateDue()
  const page = Math.max(query.page ?? 0, 0)
  const size = Math.min(Math.max(query.size ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const search = query.search?.trim().toLocaleLowerCase('pt-BR')

  return read((db) => {
    const matches = db.transactions
      .filter(
        (t) =>
          t.date.startsWith(query.month) &&
          (!query.type || t.type === query.type) &&
          (!query.categoryId || t.categoryId === query.categoryId) &&
          (!query.paymentMethod || t.paymentMethod === query.paymentMethod) &&
          (!query.creditCardId || t.creditCardId === query.creditCardId) &&
          (!search || t.description.toLocaleLowerCase('pt-BR').includes(search)),
      )
      .sort(byNewest)
    return {
      content: matches.slice(page * size, (page + 1) * size).map((t) => toTransaction(db, t)),
      page,
      size,
      totalElements: matches.length,
      totalPages: Math.ceil(matches.length / size),
    }
  })
}

function validate(input: TransactionInput) {
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
  const date = v.date('date', input.date)
  const notes = v.optionalText('notes', input.notes, 500, 'As observações devem ter no máximo 500 caracteres')
  const installments =
    input.installments == null
      ? 1
      : v.integer('installments', input.installments, 1, 48, 'O número de parcelas deve estar entre 1 e 48')
  v.check()
  return { categoryId, description, amount, date, notes, installments }
}

/** Cria o lançamento; compras parceladas viram uma parcela por fatura (devolve a primeira). */
export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const fields = validate(input)
  return write((db) => {
    const category = findCategory(db, fields.categoryId)
    const payment = resolvePayment(db, category.type, input.paymentMethod, input.creditCardId, fields.date)
    const base: TransactionRecord = {
      id: newId(),
      type: category.type,
      categoryId: category.id,
      description: fields.description,
      amount: fields.amount,
      date: fields.date,
      notes: fields.notes,
      ...payment,
      installmentGroupId: null,
      installmentNumber: null,
      installmentCount: null,
      recurringId: null,
      createdAt: timestamp(),
    }

    if (fields.installments > 1) {
      if (!payment.creditCardId) throw businessRule('Parcelamento só é possível em compras no cartão de crédito')
      const installments = splitInstallments(base, fields.installments)
      db.transactions.push(...installments)
      return toTransaction(db, installments[0])
    }
    db.transactions.push(base)
    return toTransaction(db, base)
  })
}

/**
 * Divide o valor total em parcelas iguais (os centavos que sobram vão na
 * primeira). A parcela k entra na fatura k meses depois da primeira e é
 * datada k meses depois da compra.
 */
function splitInstallments(purchase: TransactionRecord, count: number): TransactionRecord[] {
  const installment = Math.floor(purchase.amount / count)
  if (installment <= 0) throw businessRule('Cada parcela deve ser de pelo menos R$ 0,01')
  const remainder = purchase.amount - installment * count
  const groupId = newId()
  return Array.from({ length: count }, (_, k) => ({
    ...purchase,
    id: k === 0 ? purchase.id : newId(),
    amount: k === 0 ? installment + remainder : installment,
    date: addMonthsToDate(purchase.date, k),
    invoiceMonth: addMonths(purchase.invoiceMonth!, k),
    installmentGroupId: groupId,
    installmentNumber: k + 1,
    installmentCount: count,
  }))
}

/** Edita somente este lançamento (em compras parceladas, só esta parcela). */
export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  const fields = validate(input)
  return write((db) => {
    const transaction = findTransaction(db, id)
    const category = findCategory(db, fields.categoryId)
    let payment = resolvePayment(db, category.type, input.paymentMethod, input.creditCardId, fields.date)

    // Parcela com mesmo cartão e data: mantém a fatura original (k meses após a primeira).
    const sameInstallmentPlacement =
      transaction.installmentGroupId !== null &&
      payment.creditCardId !== null &&
      payment.creditCardId === transaction.creditCardId &&
      fields.date === transaction.date
    if (sameInstallmentPlacement) payment = { ...payment, invoiceMonth: transaction.invoiceMonth }

    Object.assign(transaction, {
      type: category.type,
      categoryId: category.id,
      description: fields.description,
      amount: fields.amount,
      date: fields.date,
      notes: fields.notes,
      ...payment,
    })
    return toTransaction(db, transaction)
  })
}

export function deleteTransaction(id: string, allInstallments = false): Promise<void> {
  return write((db) => {
    const transaction = findTransaction(db, id)
    const groupId = transaction.installmentGroupId
    db.transactions = db.transactions.filter((t) =>
      allInstallments && groupId ? t.installmentGroupId !== groupId : t.id !== id,
    )
  })
}

function findTransaction(db: Database, id: string): TransactionRecord {
  const transaction = db.transactions.find((t) => t.id === id)
  if (!transaction) throw notFound('Lançamento')
  return transaction
}
