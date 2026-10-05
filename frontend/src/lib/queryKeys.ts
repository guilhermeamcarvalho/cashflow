import type { DailyTotalsQuery, MonthlyTotalsQuery, TransactionQuery, TransactionType, YearMonth } from '@/types/api'

/**
 * Fábrica central de chaves do TanStack Query. Manter as chaves num só lugar
 * torna a invalidação de cache previsível (ex.: invalidar `transactions.all`
 * após criar um lançamento atualiza todas as listas).
 */
export const queryKeys = {
  profile: ['profile'] as const,
  categories: {
    all: ['categories'] as const,
    byType: (type?: TransactionType) => ['categories', type ?? 'ALL'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (query: TransactionQuery) => ['transactions', query] as const,
  },
  creditCards: {
    all: ['credit-cards'] as const,
    invoice: (cardId: string, month: YearMonth) => ['credit-cards', cardId, 'invoice', month] as const,
  },
  recurring: {
    all: ['recurring'] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    month: (month: YearMonth) => ['budgets', month] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    month: (month: YearMonth) => ['dashboard', month] as const,
    monthlyTotals: (query: MonthlyTotalsQuery) => ['dashboard', 'monthly-totals', query] as const,
    dailyTotals: (query: DailyTotalsQuery) => ['dashboard', 'daily-totals', query] as const,
  },
}
