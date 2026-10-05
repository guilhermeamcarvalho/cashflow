/**
 * Tipos que as telas consomem, devolvidos pela camada de dados local
 * (`src/data`). Valores monetários em reais (`number`) e datas como strings
 * ISO: `YYYY-MM-DD` (dia) e `YYYY-MM` (mês de referência).
 */

export type TransactionType = 'INCOME' | 'EXPENSE'

/** Forma de pagamento de uma despesa. CREDIT exige um cartão. */
export type PaymentMethod = 'PIX' | 'DEBIT' | 'CREDIT' | 'CASH' | 'BOLETO'

/** Mês de referência no formato `YYYY-MM`. */
export type YearMonth = string

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface Transaction {
  id: string
  type: TransactionType
  description: string
  amount: number
  /** Data da compra / do lançamento. */
  date: string
  /**
   * Quando o dinheiro sai (ou entra): a própria data ou, nas compras no
   * crédito, o vencimento da fatura. Listas, dashboard e orçamentos usam esta
   * data para decidir o mês.
   */
  paymentDate: string
  notes: string | null
  category: Category
  paymentMethod: PaymentMethod | null
  creditCard: CreditCardRef | null
  /** Fatura (mês de vencimento) de compras no crédito. */
  invoiceMonth: YearMonth | null
  installmentGroupId: string | null
  /** Parcela atual (1..N) de uma compra parcelada. */
  installmentNumber: number | null
  installmentCount: number | null
  /** Lançamento fixo que gerou este lançamento (null quando avulso). */
  recurringId: string | null
  createdAt: string
}

export interface TransactionInput {
  categoryId: string
  description: string
  amount: number
  date: string
  notes?: string | null
  paymentMethod?: PaymentMethod | null
  creditCardId?: string | null
  /** Parcelas (só na criação, no crédito); `amount` é o valor total. */
  installments?: number
}

export interface TransactionQuery {
  month: YearMonth
  type?: TransactionType
  categoryId?: string
  search?: string
  paymentMethod?: PaymentMethod
  creditCardId?: string
  page?: number
  size?: number
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Budget {
  id: string
  month: YearMonth
  category: Category
  amount: number
  spent: number
  remaining: number
  percentUsed: number
}

export interface BudgetOverview {
  month: YearMonth
  totalBudgeted: number
  totalSpent: number
  items: Budget[]
}

export interface BudgetInput {
  categoryId: string
  month: YearMonth
  amount: number
}

export interface Totals {
  income: number
  expenses: number
  balance: number
}

export interface CategorySlice {
  categoryId: string
  name: string
  color: string
  icon: string
  total: number
  count: number
  percent: number
}

export interface MonthlySummary {
  month: YearMonth
  current: Totals
  previous: Totals
  budgeted: number
  /** Gasto apenas nas categorias que têm orçamento no mês. */
  budgetSpent: number
  expensesByCategory: CategorySlice[]
  recentTransactions: Transaction[]
}

export interface MonthPoint {
  month: YearMonth
  income: number
  expenses: number
  balance: number
}

export interface MonthlyTotals {
  from: YearMonth
  to: YearMonth
  categoryId: string | null
  /** Todos os meses do intervalo, inclusive os sem lançamentos (zerados). */
  months: MonthPoint[]
}

export interface MonthlyTotalsQuery {
  from: YearMonth
  to: YearMonth
  categoryId?: string
}

export interface DayPoint {
  date: string
  income: number
  expenses: number
  balance: number
}

export interface DailyTotals {
  month: YearMonth
  categoryId: string | null
  /** Todos os dias do mês, inclusive os sem lançamentos (zerados). */
  days: DayPoint[]
}

export interface DailyTotalsQuery {
  month: YearMonth
  categoryId?: string
}

export interface CategoryInput {
  name: string
  type: TransactionType
  color: string
  icon: string
}

/** Lançamento fixo: gera um lançamento real por mês, no mesmo dia. */
export interface RecurringTransaction {
  id: string
  type: TransactionType
  description: string
  amount: number
  /** Dia do mês (1–31); em meses curtos, o último dia. */
  dayOfMonth: number
  startMonth: YearMonth
  /** Data do próximo lançamento a ser gerado. */
  nextDate: string
  notes: string | null
  category: Category
  paymentMethod: PaymentMethod | null
  creditCard: CreditCardRef | null
}

export interface RecurringTransactionInput {
  categoryId: string
  description: string
  amount: number
  dayOfMonth: number
  startMonth: YearMonth
  notes?: string | null
  paymentMethod?: PaymentMethod | null
  creditCardId?: string | null
}

export interface CreditCardRef {
  id: string
  name: string
  color: string
}

/** OPEN: recebendo compras · CLOSED: fechada, a pagar · OVERDUE: vencida · PAID: paga. */
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'OVERDUE' | 'PAID'

export interface InvoiceSummary {
  /** Mês de vencimento. */
  month: YearMonth
  total: number
  closingDate: string
  dueDate: string
  status: InvoiceStatus
  paidOn: string | null
}

export interface CreditCard extends CreditCardRef {
  closingDay: number
  dueDay: number
  creditLimit: number | null
  /** Limite menos as compras em faturas não pagas. */
  availableLimit: number | null
  /** Fatura que recebe as compras de hoje. */
  currentInvoice: InvoiceSummary
  /** Fatura anterior (normalmente fechada, aguardando pagamento). */
  previousInvoice: InvoiceSummary
}

export interface CreditCardInput {
  name: string
  color: string
  closingDay: number
  dueDay: number
  creditLimit?: number | null
}

export interface Invoice {
  card: CreditCardRef
  summary: InvoiceSummary
  transactions: Transaction[]
}

/** Corpo de erro no formato Problem Details (RFC 9457). */
export interface ProblemDetail {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string>
}
