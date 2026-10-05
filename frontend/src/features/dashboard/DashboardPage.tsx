import { ChevronRight, ChartPie } from 'lucide-react'
import { Link } from 'react-router'
import { useMonth } from '@/app/month'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { useProfile } from '@/features/profile/ProfileContext'
import { useCreditCards } from '@/features/creditcards/api'
import { TransactionRow } from '@/features/transactions/TransactionRow'
import { useTransactionSheet } from '@/features/transactions/TransactionSheetContext'
import { formatCurrency, formatMonth, formatShortMonth } from '@/lib/format'
import { addMonths } from '@/lib/month'
import { useMonthlySummary } from './api'
import { CardsSummary } from './CardsSummary'
import { CategoryBreakdown } from './CategoryBreakdown'
import { MonthlyTrendCard } from './MonthlyTrendCard'
import { SummaryCards } from './SummaryCards'

export default function DashboardPage() {
  const { profile } = useProfile()
  const { month } = useMonth()
  const { openCreate, openEdit } = useTransactionSheet()
  const query = useMonthlySummary(month)
  const cards = useCreditCards()
  const hasCards = (cards.data?.length ?? 0) > 0
  const firstName = profile?.name.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title="Visão geral"
        description={`${firstName ? `Olá, ${firstName}. ` : ''}Este é o resumo de ${formatMonth(month).toLowerCase()}.`}
        withMonth
      />

      {query.isPending ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-96 xl:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      ) : query.isError ? (
        <Card>
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <SummaryCards
            current={query.data.current}
            previous={query.data.previous}
            previousLabel={formatShortMonth(addMonths(month, -1))}
            budgeted={query.data.budgeted}
            budgetSpent={query.data.budgetSpent}
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <MonthlyTrendCard className="xl:col-span-2" />

            <Card className="animate-rise p-5">
              <CardHeader
                title="Despesas por categoria"
                description={`Total de ${formatCurrency(query.data.current.expenses)}`}
                className="mb-5"
              />
              {query.data.expensesByCategory.length > 0 ? (
                <CategoryBreakdown slices={query.data.expensesByCategory} />
              ) : (
                <EmptyState
                  icon={<ChartPie className="size-5" aria-hidden />}
                  title="Sem despesas no mês"
                  description="A distribuição aparece aqui assim que houver gastos."
                />
              )}
            </Card>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-3">
          <Card className={hasCards ? 'animate-rise overflow-hidden xl:col-span-2' : 'animate-rise overflow-hidden xl:col-span-3'}>
            <CardHeader
              title="Últimos lançamentos"
              className="border-b border-line px-5 py-4"
              action={
                <Link
                  to="/transactions"
                  className="flex items-center gap-0.5 text-[0.8125rem] font-medium text-accent hover:underline"
                >
                  Ver todos <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
            {query.data.recentTransactions.length > 0 ? (
              <ul className="divide-y divide-line">
                {query.data.recentTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} onSelect={openEdit} showDate />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhum lançamento ainda"
                description="Registre sua primeira receita ou despesa para começar."
                action={<Button onClick={openCreate}>Adicionar lançamento</Button>}
              />
            )}
          </Card>

          {hasCards && <CardsSummary cards={cards.data!} />}
          </div>
        </div>
      )}
    </>
  )
}
