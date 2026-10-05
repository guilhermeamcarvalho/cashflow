import type {
  CategorySlice,
  DailyTotals,
  DailyTotalsQuery,
  DayPoint,
  MonthlySummary,
  MonthlyTotals,
  MonthlyTotalsQuery,
  MonthPoint,
  Totals,
  YearMonth,
} from '@/types/api'
import { addMonths, daysInMonth, monthsBetween } from '@/lib/month'
import { businessRule } from './errors'
import { byNewest, findCategory, toTransaction } from './mappers'
import { fromCents, percentOf } from './money'
import { generateDue } from './recurring'
import type { Database, TransactionRecord } from './schema'
import { read } from './store'

/** Limite do intervalo da série mensal. */
const MAX_MONTHS = 24

const inMonth = (db: Database, month: YearMonth) => db.transactions.filter((t) => t.date.startsWith(month))

/** Soma receitas e despesas (em centavos). */
function sum(transactions: TransactionRecord[]): { income: number; expenses: number } {
  let income = 0
  let expenses = 0
  for (const t of transactions) {
    if (t.type === 'INCOME') income += t.amount
    else expenses += t.amount
  }
  return { income, expenses }
}

function toTotals({ income, expenses }: { income: number; expenses: number }): Totals {
  return { income: fromCents(income), expenses: fromCents(expenses), balance: fromCents(income - expenses) }
}

export async function monthlySummary(month: YearMonth): Promise<MonthlySummary> {
  await generateDue()
  return read((db) => {
    const transactions = inMonth(db, month)
    const current = sum(transactions)

    const byCategory = new Map<string, { total: number; count: number }>()
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue
      const entry = byCategory.get(t.categoryId) ?? { total: 0, count: 0 }
      entry.total += t.amount
      entry.count += 1
      byCategory.set(t.categoryId, entry)
    }
    const slices: CategorySlice[] = [...byCategory]
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([categoryId, { total, count }]) => {
        const category = findCategory(db, categoryId)
        return {
          categoryId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          total: fromCents(total),
          count,
          percent: percentOf(total, current.expenses),
        }
      })

    const budgets = db.budgets.filter((b) => b.month === month)
    const budgetSpent = budgets.reduce((acc, b) => acc + (byCategory.get(b.categoryId)?.total ?? 0), 0)

    return {
      month,
      current: toTotals(current),
      previous: toTotals(sum(inMonth(db, addMonths(month, -1)))),
      budgeted: fromCents(budgets.reduce((acc, b) => acc + b.amount, 0)),
      budgetSpent: fromCents(budgetSpent),
      expensesByCategory: slices,
      recentTransactions: [...transactions].sort(byNewest).slice(0, 5).map((t) => toTransaction(db, t)),
    }
  })
}

/** Série mês a mês de receitas e despesas no intervalo [from, to], opcionalmente de uma categoria. */
export async function monthlyTotals({ from, to, categoryId }: MonthlyTotalsQuery): Promise<MonthlyTotals> {
  if (from > to) throw businessRule('O mês inicial deve ser anterior ou igual ao mês final')
  if (monthsBetween(from, to) > MAX_MONTHS) throw businessRule(`O intervalo pode ter no máximo ${MAX_MONTHS} meses`)
  await generateDue()
  return read((db) => {
    if (categoryId) findCategory(db, categoryId)
    const byMonth = new Map<YearMonth, TransactionRecord[]>()
    for (const t of db.transactions) {
      const month = t.date.slice(0, 7)
      if (month < from || month > to || (categoryId && t.categoryId !== categoryId)) continue
      const list = byMonth.get(month)
      if (list) list.push(t)
      else byMonth.set(month, [t])
    }
    const months: MonthPoint[] = []
    for (let month = from; month <= to; month = addMonths(month, 1)) {
      months.push({ month, ...toTotals(sum(byMonth.get(month) ?? [])) })
    }
    return { from, to, categoryId: categoryId ?? null, months }
  })
}

/** Série dia a dia de receitas e despesas de um mês, opcionalmente de uma categoria. */
export async function dailyTotals({ month, categoryId }: DailyTotalsQuery): Promise<DailyTotals> {
  await generateDue()
  return read((db) => {
    if (categoryId) findCategory(db, categoryId)
    const transactions = inMonth(db, month).filter((t) => !categoryId || t.categoryId === categoryId)
    const days: DayPoint[] = []
    for (let day = 1; day <= daysInMonth(month); day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`
      days.push({ date, ...toTotals(sum(transactions.filter((t) => t.date === date))) })
    }
    return { month, categoryId: categoryId ?? null, days }
  })
}
