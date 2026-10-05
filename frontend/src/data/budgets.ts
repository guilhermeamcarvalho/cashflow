import type { Budget, BudgetInput, BudgetOverview, YearMonth } from '@/types/api'
import { newId, timestamp } from './clock'
import { businessRule, notFound } from './errors'
import { findCategory, paymentMonthOf, toCategory } from './mappers'
import { fromCents, percentOf } from './money'
import { generateDue } from './recurring'
import type { BudgetRecord, Database } from './schema'
import { read, write } from './store'
import { Validator } from './validation'

/** Gasto (em centavos) de uma categoria de despesa no mês (compras no crédito contam no mês da fatura). */
function spentIn(db: Database, categoryId: string, month: YearMonth): number {
  return db.transactions
    .filter((t) => t.type === 'EXPENSE' && t.categoryId === categoryId && paymentMonthOf(t) === month)
    .reduce((sum, t) => sum + t.amount, 0)
}

function toBudget(db: Database, budget: BudgetRecord): Budget {
  const spent = spentIn(db, budget.categoryId, budget.month)
  return {
    id: budget.id,
    month: budget.month,
    category: toCategory(findCategory(db, budget.categoryId)),
    amount: fromCents(budget.amount),
    spent: fromCents(spent),
    remaining: fromCents(budget.amount - spent),
    percentUsed: percentOf(spent, budget.amount),
  }
}

function overviewOf(db: Database, month: YearMonth): BudgetOverview {
  const budgets = db.budgets.filter((b) => b.month === month)
  const items = budgets.map((b) => toBudget(db, b)).sort((a, b) => b.percentUsed - a.percentUsed)
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + spentIn(db, b.categoryId, month), 0)
  return { month, totalBudgeted: fromCents(totalBudgeted), totalSpent: fromCents(totalSpent), items }
}

/** Lista os orçamentos do mês com o valor gasto em cada categoria. */
export async function budgetOverview(month: YearMonth): Promise<BudgetOverview> {
  await generateDue()
  return read((db) => overviewOf(db, month))
}

/** Cria o orçamento da categoria no mês ou atualiza o valor, se já existir. */
export async function upsertBudget(input: BudgetInput): Promise<Budget> {
  const v = new Validator()
  const categoryId = v.required('categoryId', input.categoryId, 'Escolha uma categoria')
  const month = v.month('month', input.month)
  const amount = v.money('amount', input.amount)
  v.check()

  return write((db) => {
    const category = findCategory(db, categoryId)
    if (category.type !== 'EXPENSE') {
      throw businessRule('Orçamentos só podem ser definidos para categorias de despesa')
    }
    let budget = db.budgets.find((b) => b.categoryId === categoryId && b.month === month)
    if (budget) budget.amount = amount
    else {
      budget = { id: newId(), categoryId, month, amount, createdAt: timestamp() }
      db.budgets.push(budget)
    }
    return toBudget(db, budget)
  })
}

export function deleteBudget(id: string): Promise<void> {
  return write((db) => {
    if (!db.budgets.some((b) => b.id === id)) throw notFound('Orçamento')
    db.budgets = db.budgets.filter((b) => b.id !== id)
  })
}

/** Replica os orçamentos de um mês para outro, mantendo os que já existem no destino. */
export async function copyBudgets(fromMonth: YearMonth, toMonth: YearMonth): Promise<BudgetOverview> {
  if (fromMonth === toMonth) throw businessRule('Os meses de origem e destino devem ser diferentes')
  return write((db) => {
    const alreadyDefined = new Set(db.budgets.filter((b) => b.month === toMonth).map((b) => b.categoryId))
    const createdAt = timestamp()
    const copies = db.budgets
      .filter((b) => b.month === fromMonth && !alreadyDefined.has(b.categoryId))
      .map((b) => ({ id: newId(), categoryId: b.categoryId, month: toMonth, amount: b.amount, createdAt }))
    db.budgets.push(...copies)
    return overviewOf(db, toMonth)
  })
}
