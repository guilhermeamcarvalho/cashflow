import type {
  CreditCard,
  CreditCardInput,
  Invoice,
  InvoiceStatus,
  InvoiceSummary,
  PaymentMethod,
  TransactionType,
  YearMonth,
} from '@/types/api'
import { closingDateOf, dueDateOf, invoiceFor } from '@/lib/creditCard'
import { addMonths } from '@/lib/month'
import { newId, timestamp, today } from './clock'
import { businessRule, conflict } from './errors'
import { byNewest, findCard, toCardRef, toTransaction } from './mappers'
import { fromCents } from './money'
import { generateDue } from './recurring'
import type { CreditCardRecord, Database } from './schema'
import { read, write } from './store'
import { Validator } from './validation'

/**
 * Cartões de crédito. As faturas são identificadas pelo mês de VENCIMENTO
 * ("fatura de novembro" = a que vence em novembro); as regras de fechamento
 * ficam em `lib/creditCard.ts`, compartilhadas com o formulário.
 */

export interface Payment {
  paymentMethod: PaymentMethod | null
  creditCardId: string | null
  invoiceMonth: YearMonth | null
}

const NO_PAYMENT: Payment = { paymentMethod: null, creditCardId: null, invoiceMonth: null }

/**
 * Valida e monta a forma de pagamento de um lançamento. Receitas não têm forma
 * de pagamento; compras no crédito exigem um cartão e entram na fatura
 * calculada a partir da data.
 */
export function resolvePayment(
  db: Database,
  type: TransactionType,
  method: PaymentMethod | null | undefined,
  cardId: string | null | undefined,
  date: string,
): Payment {
  if (type === 'INCOME') return NO_PAYMENT
  if (method === 'CREDIT') {
    if (!cardId) throw businessRule('Escolha o cartão de crédito')
    const card = findCard(db, cardId)
    return { paymentMethod: 'CREDIT', creditCardId: card.id, invoiceMonth: invoiceFor(card, date) }
  }
  if (cardId) throw businessRule('Cartão só pode ser informado em compras no crédito')
  return { ...NO_PAYMENT, paymentMethod: method ?? null }
}

function invoiceTotal(db: Database, cardId: string, month: YearMonth): number {
  return db.transactions
    .filter((t) => t.creditCardId === cardId && t.invoiceMonth === month)
    .reduce((sum, t) => sum + t.amount, 0)
}

function paidOn(db: Database, cardId: string, month: YearMonth): string | null {
  return db.invoicePayments.find((p) => p.cardId === cardId && p.month === month)?.paidOn ?? null
}

function status(total: number, closing: string, due: string, paid: string | null): InvoiceStatus {
  const now = today()
  if (paid) return 'PAID'
  if (now < closing) return 'OPEN'
  if (total === 0) return 'PAID' // fechada sem compras: nada a pagar
  return now > due ? 'OVERDUE' : 'CLOSED'
}

function summary(db: Database, card: CreditCardRecord, month: YearMonth): InvoiceSummary {
  const total = invoiceTotal(db, card.id, month)
  const closingDate = closingDateOf(card, month)
  const dueDate = dueDateOf(card, month)
  const paid = paidOn(db, card.id, month)
  return { month, total: fromCents(total), closingDate, dueDate, status: status(total, closingDate, dueDate, paid), paidOn: paid }
}

function toCreditCard(db: Database, card: CreditCardRecord): CreditCard {
  const current = invoiceFor(card, today())
  const unpaid = db.transactions
    .filter((t) => t.creditCardId === card.id && t.invoiceMonth && !paidOn(db, card.id, t.invoiceMonth))
    .reduce((sum, t) => sum + t.amount, 0)
  return {
    id: card.id,
    name: card.name,
    color: card.color,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    creditLimit: card.creditLimit === null ? null : fromCents(card.creditLimit),
    availableLimit: card.creditLimit === null ? null : fromCents(card.creditLimit - unpaid),
    currentInvoice: summary(db, card, current),
    previousInvoice: summary(db, card, addMonths(current, -1)),
  }
}

export async function listCreditCards(): Promise<CreditCard[]> {
  await generateDue()
  return read((db) =>
    [...db.creditCards].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((card) => toCreditCard(db, card)),
  )
}

function validate(input: CreditCardInput) {
  const v = new Validator()
  const name = v.text('name', input.name, 60, 'Informe o nome', 'O nome deve ter no máximo 60 caracteres')
  const color = v.color('color', input.color)
  const closingDay = v.integer('closingDay', input.closingDay, 1, 31, 'O dia deve estar entre 1 e 31')
  const dueDay = v.integer('dueDay', input.dueDay, 1, 31, 'O dia deve estar entre 1 e 31')
  const creditLimit =
    input.creditLimit == null ? null : v.money('creditLimit', input.creditLimit, 'O limite deve ser maior que zero')
  v.check()
  return { name, color, closingDay, dueDay, creditLimit }
}

function assertUniqueName(db: Database, name: string, exceptId?: string) {
  const key = name.toLocaleLowerCase('pt-BR')
  if (db.creditCards.some((c) => c.id !== exceptId && c.name.toLocaleLowerCase('pt-BR') === key)) {
    throw conflict('Já existe um cartão com este nome', 'name')
  }
}

export async function createCreditCard(input: CreditCardInput): Promise<CreditCard> {
  const fields = validate(input)
  return write((db) => {
    assertUniqueName(db, fields.name)
    const card: CreditCardRecord = { id: newId(), ...fields, createdAt: timestamp() }
    db.creditCards.push(card)
    return toCreditCard(db, card)
  })
}

/** Alterar fechamento/vencimento vale para as próximas compras; as já lançadas mantêm a fatura. */
export async function updateCreditCard(id: string, input: CreditCardInput): Promise<CreditCard> {
  const fields = validate(input)
  return write((db) => {
    const card = findCard(db, id)
    assertUniqueName(db, fields.name, id)
    Object.assign(card, fields)
    return toCreditCard(db, card)
  })
}

export function deleteCreditCard(id: string): Promise<void> {
  return write((db) => {
    findCard(db, id)
    if (db.transactions.some((t) => t.creditCardId === id) || db.recurring.some((r) => r.creditCardId === id)) {
      throw conflict('Cartão possui lançamentos e não pode ser excluído')
    }
    db.invoicePayments = db.invoicePayments.filter((p) => p.cardId !== id)
    db.creditCards = db.creditCards.filter((c) => c.id !== id)
  })
}

export async function getInvoice(cardId: string, month: YearMonth): Promise<Invoice> {
  await generateDue()
  return read((db) => {
    const card = findCard(db, cardId)
    const transactions = db.transactions
      .filter((t) => t.creditCardId === cardId && t.invoiceMonth === month)
      .sort(byNewest)
      .map((t) => toTransaction(db, t))
    return { card: toCardRef(card)!, summary: summary(db, card, month), transactions }
  })
}

export function markInvoicePaid(cardId: string, month: YearMonth): Promise<InvoiceSummary> {
  return write((db) => {
    const card = findCard(db, cardId)
    if (today() < closingDateOf(card, month)) {
      throw businessRule('A fatura ainda está aberta e não pode ser marcada como paga')
    }
    if (!paidOn(db, cardId, month)) db.invoicePayments.push({ cardId, month, paidOn: today() })
    return summary(db, card, month)
  })
}

export function unmarkInvoicePaid(cardId: string, month: YearMonth): Promise<InvoiceSummary> {
  return write((db) => {
    const card = findCard(db, cardId)
    db.invoicePayments = db.invoicePayments.filter((p) => !(p.cardId === cardId && p.month === month))
    return summary(db, card, month)
  })
}
