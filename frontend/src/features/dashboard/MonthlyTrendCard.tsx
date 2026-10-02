import clsx from 'clsx'
import { Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMonth } from '@/app/month'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Card, CardHeader } from '@/components/ui/Card'
import { describePeriod, PeriodPicker, type PeriodValue } from '@/components/ui/PeriodPicker'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useCategories } from '@/features/categories/api'
import { formatDayHeading, formatMonth, formatShortMonth } from '@/lib/format'
import { addMonths } from '@/lib/month'
import { useDailyTotals, useMonthlyTotals } from './api'
import { TrendChart, type Metric, type TrendPoint } from './TrendChart'

const METRIC_OPTIONS = [
  { value: 'EXPENSE' as const, label: 'Despesas' },
  { value: 'INCOME' as const, label: 'Receitas' },
  { value: 'BOTH' as const, label: 'Comparar' },
]

const TITLES: Record<PeriodValue['kind'], Record<Metric, string>> = {
  range: { EXPENSE: 'Gastos por mês', INCOME: 'Receitas por mês', BOTH: 'Receitas × despesas por mês' },
  month: { EXPENSE: 'Gastos por dia', INCOME: 'Receitas por dia', BOTH: 'Receitas × despesas por dia' },
}

/**
 * Evolução de receitas/despesas com filtros:
 * - **Período** (calendário): intervalo de meses → uma barra por mês;
 *   ou **mês específico** → uma barra por dia daquele mês.
 * - **Tipo**: despesas, receitas ou comparação.
 * - **Categoria**: restringe a uma categoria (exceto em "Comparar").
 * No modo intervalo, clicar numa barra seleciona aquele mês no app inteiro.
 */
export function MonthlyTrendCard({ className }: { className?: string }) {
  const { month, setMonth } = useMonth()
  const [period, setPeriod] = useState<PeriodValue>(() => ({ kind: 'range', from: addMonths(month, -5), to: month }))
  const [metric, setMetric] = useState<Metric>('EXPENSE')
  const [categoryId, setCategoryId] = useState('')

  const categories = useCategories(metric === 'BOTH' ? undefined : metric)
  const category = metric === 'BOTH' ? undefined : categoryId || undefined

  const monthly = useMonthlyTotals(
    period.kind === 'range' ? { from: period.from, to: period.to, categoryId: category } : { from: month, to: month },
    period.kind === 'range',
  )
  const daily = useDailyTotals(
    { month: period.kind === 'month' ? period.month : month, categoryId: category },
    period.kind === 'month',
  )
  const query = period.kind === 'range' ? monthly : daily

  const points = useMemo<TrendPoint[]>(() => {
    if (period.kind === 'range') {
      const months = monthly.data?.months ?? []
      const spansYears =
        months.length > 0 && months[0].month.slice(0, 4) !== months[months.length - 1].month.slice(0, 4)
      return months.map((point) => ({
        key: point.month,
        label: spansYears ? `${formatShortMonth(point.month)}/${point.month.slice(2, 4)}` : formatShortMonth(point.month),
        title: formatMonth(point.month),
        income: point.income,
        expenses: point.expenses,
        balance: point.balance,
        highlighted: point.month === month,
      }))
    }
    return (daily.data?.days ?? []).map((point) => ({
      key: point.date,
      label: String(Number(point.date.slice(8))),
      title: formatDayHeading(point.date),
      income: point.income,
      expenses: point.expenses,
      balance: point.balance,
    }))
  }, [period.kind, monthly.data, daily.data, month])

  function changeMetric(next: Metric) {
    setMetric(next)
    setCategoryId('') // categorias de receita e despesa são distintas
  }

  const title = TITLES[period.kind][metric]

  return (
    <Card className={clsx('animate-rise min-w-0 p-5', className)}>
      <CardHeader title={title} description={describePeriod(period)} className="mb-4" />

      {/* Filtros: sempre acima do gráfico */}
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_15rem_minmax(0,1fr)]">
        <PeriodPicker value={period} onChange={setPeriod} reference={month} />
        <SegmentedControl label="Tipo" options={METRIC_OPTIONS} value={metric} onChange={changeMetric} />
        <Select
          variant="pill"
          ariaLabel="Categoria"
          value={categoryId}
          onChange={setCategoryId}
          disabled={metric === 'BOTH'}
          options={[
            { value: '', label: 'Todas as categorias', icon: <AllCategoriesIcon /> },
            ...(metric === 'BOTH' ? [] : (categories.data ?? [])).map((item) => ({
              value: item.id,
              label: item.name,
              icon: <CategoryIcon icon={item.icon} color={item.color} size="xs" />,
            })),
          ]}
        />
      </div>

      {query.isPending ? (
        <Skeleton className="h-64" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : (
        <div className={query.isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <TrendChart
            points={points}
            metric={metric}
            unit={period.kind === 'range' ? 'mês' : 'dia'}
            caption={`${title} — ${describePeriod(period)}`}
            onSelect={period.kind === 'range' ? (point) => setMonth(point.key) : undefined}
            selectHint={period.kind === 'range' ? 'Toque para ver este mês' : undefined}
          />
        </div>
      )}
    </Card>
  )
}

function AllCategoriesIcon() {
  return (
    <span className="inline-flex size-5 items-center justify-center rounded bg-surface-3 text-ink-2" aria-hidden>
      <Tags className="size-3" strokeWidth={2} />
    </span>
  )
}
