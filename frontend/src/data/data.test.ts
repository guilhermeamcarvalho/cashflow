import { beforeEach, describe, expect, it } from 'vitest'
import { exportBackup, importBackup, clearAllData } from './backup'
import { budgetOverview, copyBudgets, upsertBudget } from './budgets'
import { deleteCategory, listCategories } from './categories'
import { setClock } from './clock'
import { createCreditCard, deleteCreditCard, getInvoice, listCreditCards, markInvoicePaid } from './creditCards'
import { dailyTotals, monthlySummary, monthlyTotals } from './dashboard'
import { AppError } from './errors'
import { createProfile, getProfile } from './profile'
import { createRecurring, deleteRecurring, listRecurring, updateRecurring } from './recurring'
import { memoryAdapter, setStorageAdapter } from './store'
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from './transactions'

// Mesmos cenários dos testes de integração da antiga API.

async function categoryId(name: string): Promise<string> {
  const category = (await listCategories()).find((c) => c.name === name)
  if (!category) throw new Error(`categoria ${name} não existe`)
  return category.id
}

async function rejection(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(AppError)
  return error as AppError
}

beforeEach(async () => {
  setStorageAdapter(memoryAdapter())
  setClock(() => new Date(2026, 9, 15, 12)) // 15/10/2026
  await createProfile('Ana Souza')
})

describe('perfil', () => {
  it('cria o perfil com as categorias padrão', async () => {
    expect((await getProfile())?.name).toBe('Ana Souza')
    expect(await listCategories('INCOME')).toHaveLength(4)
    expect(await listCategories('EXPENSE')).toHaveLength(9)
  })
})

describe('lançamentos, orçamentos e dashboard', () => {
  it('o fluxo do mês produz resumo e orçamentos consistentes', async () => {
    const food = await categoryId('Alimentação')
    const salary = await categoryId('Salário')
    await createTransaction({ categoryId: salary, description: 'Salário', amount: 5000, date: '2026-10-05' })
    await createTransaction({ categoryId: food, description: 'Mercado', amount: 0.1, date: '2026-10-06' })
    await createTransaction({ categoryId: food, description: 'Feira', amount: 0.2, date: '2026-10-07' })
    await createTransaction({ categoryId: food, description: 'Mês passado', amount: 100, date: '2026-09-30' })
    await upsertBudget({ categoryId: food, month: '2026-10', amount: 1 })

    const summary = await monthlySummary('2026-10')
    expect(summary.current).toEqual({ income: 5000, expenses: 0.3, balance: 4999.7 })
    expect(summary.previous.expenses).toBe(100)
    expect(summary.budgeted).toBe(1)
    expect(summary.budgetSpent).toBe(0.3)
    expect(summary.expensesByCategory[0]).toMatchObject({ name: 'Alimentação', total: 0.3, count: 2, percent: 100 })
    expect(summary.recentTransactions.map((t) => t.description)).toEqual(['Feira', 'Mercado', 'Salário'])

    const budgets = await budgetOverview('2026-10')
    expect(budgets.items[0]).toMatchObject({ spent: 0.3, remaining: 0.7, percentUsed: 30 })

    await copyBudgets('2026-10', '2026-11')
    expect((await budgetOverview('2026-11')).totalBudgeted).toBe(1)
    await rejection(upsertBudget({ categoryId: salary, month: '2026-10', amount: 10 }))
  })

  it('lista com filtros, busca e paginação', async () => {
    const food = await categoryId('Alimentação')
    for (let day = 1; day <= 12; day++) {
      await createTransaction({ categoryId: food, description: `Café ${day}`, amount: 5, date: `2026-10-${String(day).padStart(2, '0')}` })
    }
    const page = await listTransactions({ month: '2026-10', search: 'café', page: 1, size: 5 })
    expect(page).toMatchObject({ totalElements: 12, totalPages: 3, page: 1 })
    expect(page.content[0].description).toBe('Café 7')
    expect((await listTransactions({ month: '2026-10', type: 'INCOME' })).totalElements).toBe(0)
  })

  it('série mensal preenche meses vazios e filtra por categoria', async () => {
    const food = await categoryId('Alimentação')
    const bills = await categoryId('Contas')
    await createTransaction({ categoryId: food, description: 'A', amount: 10, date: '2026-08-10' })
    await createTransaction({ categoryId: bills, description: 'B', amount: 20, date: '2026-10-10' })
    const all = await monthlyTotals({ from: '2026-08', to: '2026-10' })
    expect(all.months.map((m) => m.expenses)).toEqual([10, 0, 20])
    const onlyFood = await monthlyTotals({ from: '2026-08', to: '2026-10', categoryId: food })
    expect(onlyFood.months.map((m) => m.expenses)).toEqual([10, 0, 0])
    await rejection(monthlyTotals({ from: '2024-01', to: '2026-10' }))
  })

  it('valida campos e protege categorias em uso', async () => {
    const food = await categoryId('Alimentação')
    const error = await rejection(createTransaction({ categoryId: food, description: ' ', amount: 0, date: '2026-10-01' }))
    expect(Object.keys(error.fieldErrors)).toEqual(['description', 'amount'])

    const t = await createTransaction({ categoryId: food, description: 'Pão', amount: 8, date: '2026-10-01' })
    expect((await rejection(deleteCategory(food))).status).toBe(409)
    await deleteTransaction(t.id)
    await deleteCategory(food)
  })
})

describe('cartão de crédito', () => {
  it('compras, parcelas e faturas', async () => {
    const shopping = await categoryId('Compras')
    const salary = await categoryId('Salário')
    const card = await createCreditCard({ name: 'Nubank', color: '#8a05be', closingDay: 3, dueDay: 10, creditLimit: 5000 })
    expect(card).toMatchObject({ color: '#8A05BE', availableLimit: 5000 })
    expect((await rejection(createCreditCard({ name: 'nubank', color: '#000000', closingDay: 1, dueDay: 2 }))).status).toBe(409)

    const credit = { paymentMethod: 'CREDIT' as const, creditCardId: card.id }
    const book = await createTransaction({ categoryId: shopping, description: 'Livro', amount: 120, date: '2025-03-02', ...credit })
    expect(book).toMatchObject({ invoiceMonth: '2025-03', creditCard: { name: 'Nubank' } })

    const first = await createTransaction({
      categoryId: shopping,
      description: 'Fone',
      amount: 1000,
      date: '2025-03-05',
      installments: 3,
      ...credit,
    })
    expect(first).toMatchObject({ amount: 333.34, installmentNumber: 1, installmentCount: 3, invoiceMonth: '2025-04' })

    const june = await getInvoice(card.id, '2025-06')
    expect(june.summary).toMatchObject({ total: 333.33, closingDate: '2025-06-03', dueDate: '2025-06-10', status: 'OVERDUE' })
    expect(june.transactions[0]).toMatchObject({ date: '2025-05-05', installmentNumber: 3 })

    // listas por mês de pagamento: em março só o livro; a 1ª parcela do fone vence em abril
    expect((await listTransactions({ month: '2025-03', creditCardId: card.id })).totalElements).toBe(1)
    expect((await listTransactions({ month: '2025-04', creditCardId: card.id })).content[0]).toMatchObject({
      description: 'Fone',
      date: '2025-03-05',
      paymentDate: '2025-04-10',
    })
    expect((await listTransactions({ month: '2025-03', paymentMethod: 'PIX' })).totalElements).toBe(0)

    expect((await markInvoicePaid(card.id, '2025-03')).status).toBe('PAID')
    expect((await listCreditCards())[0].availableLimit).toBe(4000)
    await rejection(markInvoicePaid(card.id, '2099-01'))

    // regras de forma de pagamento
    await rejection(createTransaction({ categoryId: shopping, description: 'X', amount: 10, date: '2025-03-02', paymentMethod: 'CREDIT' }))
    await rejection(
      createTransaction({ categoryId: shopping, description: 'X', amount: 10, date: '2025-03-02', paymentMethod: 'PIX', installments: 2 }),
    )
    const income = await createTransaction({ categoryId: salary, description: 'Salário', amount: 3000, date: '2025-03-01', ...credit })
    expect(income).toMatchObject({ paymentMethod: null, creditCard: null })

    // editar uma parcela sem mudar data/cartão mantém a fatura dela
    const second = (await listTransactions({ month: '2025-05', creditCardId: card.id })).content[0]
    expect(second).toMatchObject({ installmentNumber: 2, date: '2025-04-05' })
    expect((await updateTransaction(second.id, { ...second, categoryId: shopping, amount: 300, ...credit })).invoiceMonth).toBe('2025-05')

    expect((await rejection(deleteCreditCard(card.id))).status).toBe(409)
    await deleteTransaction(first.id, true)
    expect((await getInvoice(card.id, '2025-06')).transactions).toHaveLength(0)
  })
})

describe('compras no crédito contam no mês em que a fatura é paga', () => {
  it('lista, dashboard, série diária e orçamento usam o vencimento da fatura', async () => {
    const shopping = await categoryId('Compras')
    // Inter: fecha dia 5, vence dia 12
    const card = await createCreditCard({ name: 'Inter', color: '#FF7A00', closingDay: 5, dueDay: 12 })
    const credit = { paymentMethod: 'CREDIT' as const, creditCardId: card.id }
    await createTransaction({ categoryId: shopping, description: 'Lego', amount: 59.8, date: '2026-10-06', ...credit })
    await createTransaction({ categoryId: shopping, description: 'Pix', amount: 10, date: '2026-10-06', paymentMethod: 'PIX' })
    await upsertBudget({ categoryId: shopping, month: '2026-11', amount: 100 })

    // comprado em 06/10, depois do fechamento: fatura que vence em 12/11
    expect((await listTransactions({ month: '2026-10' })).content.map((t) => t.description)).toEqual(['Pix'])
    const november = await listTransactions({ month: '2026-11' })
    expect(november.content[0]).toMatchObject({ description: 'Lego', date: '2026-10-06', paymentDate: '2026-11-12' })

    expect((await monthlySummary('2026-10')).current.expenses).toBe(10)
    expect((await monthlySummary('2026-11')).current.expenses).toBe(59.8)
    const days = (await dailyTotals({ month: '2026-11' })).days
    expect(days.find((d) => d.date === '2026-11-12')?.expenses).toBe(59.8)
    expect((await budgetOverview('2026-11')).items[0]).toMatchObject({ spent: 59.8 })
  })
})

describe('lançamentos fixos', () => {
  it('geram um lançamento por mês até o mês corrente', async () => {
    const housing = await categoryId('Moradia')
    const recurring = await createRecurring({ categoryId: housing, description: 'Aluguel', amount: 1500, dayOfMonth: 31, startMonth: '2026-08' })
    expect(recurring).toMatchObject({ type: 'EXPENSE', nextDate: '2026-11-30' })

    for (const [month, date] of [['2026-08', '2026-08-31'], ['2026-09', '2026-09-30'], ['2026-10', '2026-10-31']]) {
      const page = await listTransactions({ month })
      expect(page.totalElements).toBe(1)
      expect(page.content[0]).toMatchObject({ date, recurringId: recurring.id })
    }
    expect((await listTransactions({ month: '2026-11' })).totalElements).toBe(0)

    // leituras repetidas não duplicam; excluído não volta
    expect((await monthlySummary('2026-10')).current.expenses).toBe(1500)
    const generated = (await listTransactions({ month: '2026-10' })).content[0]
    await deleteTransaction(generated.id)
    expect((await listTransactions({ month: '2026-10' })).totalElements).toBe(0)

    // virada do mês gera o próximo
    setClock(() => new Date(2026, 10, 2))
    expect((await listTransactions({ month: '2026-11' })).totalElements).toBe(1)

    // edição vale para os próximos meses; o histórico não muda
    const edited = await updateRecurring(recurring.id, { categoryId: housing, description: 'Aluguel novo', amount: 1600, dayOfMonth: 10, startMonth: '2026-08' })
    expect(edited).toMatchObject({ amount: 1600, nextDate: '2026-12-10' })
    expect((await listTransactions({ month: '2026-08' })).content[0].amount).toBe(1500)

    await rejection(updateRecurring(recurring.id, { categoryId: housing, description: 'A', amount: 1, dayOfMonth: 10, startMonth: '2027-01' }))
    await rejection(
      updateRecurring(recurring.id, { categoryId: await categoryId('Salário'), description: 'A', amount: 1, dayOfMonth: 10, startMonth: '2026-08' }),
    )

    // encerrar mantém o histórico, desvinculado do modelo
    await deleteRecurring(recurring.id)
    expect(await listRecurring()).toHaveLength(0)
    expect((await listTransactions({ month: '2026-08' })).content[0].recurringId).toBeNull()
  })

  it('fixo futuro ainda não é lançado e bloqueia a exclusão da categoria', async () => {
    const bills = await categoryId('Contas')
    const recurring = await createRecurring({ categoryId: bills, description: 'Internet', amount: 120, dayOfMonth: 5, startMonth: '2026-11' })
    expect(recurring.nextDate).toBe('2026-11-05')
    expect((await listTransactions({ month: '2026-11' })).totalElements).toBe(0)
    expect((await rejection(deleteCategory(bills))).status).toBe(409)

    const error = await rejection(createRecurring({ categoryId: bills, description: '', amount: 0, dayOfMonth: 32, startMonth: '2026-11' }))
    expect(error.fieldErrors).toHaveProperty('dayOfMonth')
    expect(error.fieldErrors).toHaveProperty('amount')
  })
})

describe('backup', () => {
  it('exporta, apaga e restaura todos os dados', async () => {
    const food = await categoryId('Alimentação')
    await createTransaction({ categoryId: food, description: 'Pizza', amount: 59.9, date: '2026-10-10' })
    const backup = await exportBackup()

    await clearAllData()
    expect(await getProfile()).toBeNull()

    await importBackup(backup)
    expect((await getProfile())?.name).toBe('Ana Souza')
    expect((await listTransactions({ month: '2026-10' })).content[0]).toMatchObject({ description: 'Pizza', amount: 59.9 })

    await rejection(importBackup('{"format":"outro"}'))
    await rejection(importBackup('não é json'))
  })
})
