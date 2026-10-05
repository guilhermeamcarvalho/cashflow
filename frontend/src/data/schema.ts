import type { PaymentMethod, TransactionType, YearMonth } from '@/types/api'

/**
 * Formato dos dados guardados no navegador. É também o formato do backup
 * (exportar/importar), então mudanças aqui exigem subir {@link SCHEMA_VERSION}
 * e migrar em `migrate()`.
 *
 * Valores monetários ficam em CENTAVOS (inteiros) para as somas serem exatas;
 * a conversão para reais acontece só na saída (`mappers.ts`).
 */
export const SCHEMA_VERSION = 1

export interface ProfileRecord {
  name: string
  createdAt: string
}

export interface CategoryRecord {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  createdAt: string
}

export interface TransactionRecord {
  id: string
  type: TransactionType
  categoryId: string
  description: string
  amount: number
  date: string
  notes: string | null
  paymentMethod: PaymentMethod | null
  creditCardId: string | null
  /** Fatura (mês de vencimento) de compras no crédito. */
  invoiceMonth: YearMonth | null
  installmentGroupId: string | null
  installmentNumber: number | null
  installmentCount: number | null
  recurringId: string | null
  createdAt: string
}

export interface BudgetRecord {
  id: string
  categoryId: string
  month: YearMonth
  amount: number
  createdAt: string
}

export interface CreditCardRecord {
  id: string
  name: string
  color: string
  closingDay: number
  dueDay: number
  creditLimit: number | null
  createdAt: string
}

export interface InvoicePaymentRecord {
  cardId: string
  /** Mês de vencimento da fatura paga. */
  month: YearMonth
  paidOn: string
}

export interface RecurringRecord {
  id: string
  type: TransactionType
  categoryId: string
  description: string
  amount: number
  dayOfMonth: number
  startMonth: YearMonth
  /** Último mês já gerado; null enquanto nenhum foi gerado. */
  generatedThrough: YearMonth | null
  notes: string | null
  paymentMethod: PaymentMethod | null
  creditCardId: string | null
  createdAt: string
}

export interface Database {
  version: number
  /** null até o primeiro acesso (tela de boas-vindas). */
  profile: ProfileRecord | null
  categories: CategoryRecord[]
  transactions: TransactionRecord[]
  budgets: BudgetRecord[]
  creditCards: CreditCardRecord[]
  invoicePayments: InvoicePaymentRecord[]
  recurring: RecurringRecord[]
}

export function emptyDatabase(): Database {
  return {
    version: SCHEMA_VERSION,
    profile: null,
    categories: [],
    transactions: [],
    budgets: [],
    creditCards: [],
    invoicePayments: [],
    recurring: [],
  }
}

/** Converte dados de versões anteriores para a atual (por ora só existe a v1). */
export function migrate(db: Database): Database {
  return { ...emptyDatabase(), ...db, version: SCHEMA_VERSION }
}
