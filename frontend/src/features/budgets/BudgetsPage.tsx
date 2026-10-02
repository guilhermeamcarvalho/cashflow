import clsx from 'clsx'
import { ChevronRight, Copy, PiggyBank, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useMonth } from '@/app/month'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatShortMonth } from '@/lib/format'
import { addMonths } from '@/lib/month'
import type { Budget } from '@/types/api'
import { useBudgets, useCopyBudgets } from './api'
import { BudgetForm } from './BudgetForm'
import { BudgetBar, BudgetStatusLabel } from './BudgetProgress'

type FormState = { open: false } | { open: true; budget?: Budget }

export default function BudgetsPage() {
  const { month } = useMonth()
  const toast = useToast()
  const query = useBudgets(month)
  const copy = useCopyBudgets()
  const [form, setForm] = useState<FormState>({ open: false })

  const overview = query.data
  const previousMonth = addMonths(month, -1)
  const remaining = overview ? overview.totalBudgeted - overview.totalSpent : 0
  const overallPercent =
    overview && overview.totalBudgeted > 0 ? Math.round((overview.totalSpent / overview.totalBudgeted) * 100) : 0

  async function copyFromPrevious() {
    try {
      const result = await copy.mutateAsync({ from: previousMonth, to: month })
      toast.success(
        result.items.length > 0 ? 'Orçamentos copiados' : `Nenhum orçamento em ${formatShortMonth(previousMonth)}`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao copiar')
    }
  }

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Limites de gasto por categoria para o mês."
        withMonth
        action={
          <Button onClick={() => setForm({ open: true })}>
            <Plus className="size-4" aria-hidden /> Novo
          </Button>
        }
      />

      {query.isPending ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : query.isError ? (
        <Card>
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </Card>
      ) : overview && overview.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank className="size-5" aria-hidden />}
            title="Nenhum orçamento neste mês"
            description="Defina limites por categoria e acompanhe quanto ainda pode gastar."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => setForm({ open: true })}>Definir orçamento</Button>
                <Button variant="secondary" onClick={copyFromPrevious} loading={copy.isPending}>
                  <Copy className="size-4" aria-hidden /> Copiar de {formatShortMonth(previousMonth)}
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        overview && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Orçado" value={formatCurrency(overview.totalBudgeted)} />
              <Stat label="Gasto" value={formatCurrency(overview.totalSpent)}>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <BudgetBar percentUsed={overallPercent} label="Uso total do orçamento" />
                  </div>
                  <span className="num text-xs font-medium text-ink-2">{overallPercent}%</span>
                </div>
              </Stat>
              <Stat
                label={remaining >= 0 ? 'Disponível' : 'Excedido'}
                value={formatCurrency(Math.abs(remaining))}
                valueClassName={remaining < 0 ? 'text-expense' : undefined}
              >
                <BudgetStatusLabel percentUsed={overallPercent} className="mt-3" />
              </Stat>
            </div>

            <Card className="animate-rise overflow-hidden">
              <CardHeader
                title="Por categoria"
                description={`${overview.items.length} ${overview.items.length === 1 ? 'categoria' : 'categorias'} com limite`}
                className="border-b border-line px-5 py-4"
              />
              {/* Cabeçalho da tabela (desktop) */}
              <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_12rem_7rem_1rem] gap-6 border-b border-line bg-surface-2 px-5 py-2 text-xs font-medium text-ink-3 md:grid">
                <span>Categoria</span>
                <span>Consumo</span>
                <span className="text-right">Gasto / Limite</span>
                <span className="text-right">Restante</span>
                <span />
              </div>
              <ul className="divide-y divide-line">
                {overview.items.map((budget) => (
                  <li key={budget.id}>
                    <button
                      type="button"
                      onClick={() => setForm({ open: true, budget })}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 px-5 py-3.5 text-left transition-colors hover:bg-surface-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_12rem_7rem_1rem] md:gap-6"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <CategoryIcon icon={budget.category.icon} color={budget.category.color} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{budget.category.name}</span>
                          <BudgetStatusLabel percentUsed={budget.percentUsed} />
                        </span>
                      </span>

                      <span className="num text-right text-sm font-medium md:hidden">{budget.percentUsed}%</span>

                      <span className="col-span-2 flex items-center gap-3 md:col-span-1">
                        <span className="flex-1">
                          <BudgetBar percentUsed={budget.percentUsed} label={`Uso do orçamento de ${budget.category.name}`} />
                        </span>
                        <span className="num hidden w-10 text-right text-xs font-medium text-ink-2 md:block">
                          {budget.percentUsed}%
                        </span>
                      </span>

                      <span className="num text-[0.8125rem] whitespace-nowrap text-ink-3 md:text-right md:text-ink-2">
                        {formatCurrency(budget.spent)}
                        <span className="text-ink-3"> / {formatCurrency(budget.amount)}</span>
                      </span>

                      <span
                        className={clsx(
                          'num text-right text-[0.8125rem] font-medium',
                          budget.remaining >= 0 ? 'text-ink' : 'text-expense',
                        )}
                      >
                        {budget.remaining >= 0
                          ? formatCurrency(budget.remaining)
                          : `−${formatCurrency(-budget.remaining)}`}
                      </span>

                      <ChevronRight className="hidden size-4 text-ink-3 md:block" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )
      )}

      <Sheet
        open={form.open}
        onClose={() => setForm({ open: false })}
        title={form.open && form.budget ? 'Editar orçamento' : 'Novo orçamento'}
      >
        {form.open && (
          <BudgetForm
            key={form.budget?.id ?? 'new'}
            month={month}
            budget={form.budget}
            usedCategoryIds={overview?.items.map((item) => item.category.id) ?? []}
            onDone={() => setForm({ open: false })}
          />
        )}
      </Sheet>
    </>
  )
}

interface StatProps {
  label: string
  value: string
  valueClassName?: string
  children?: ReactNode
}

function Stat({ label, value, valueClassName, children }: StatProps) {
  return (
    <Card className="animate-rise p-5">
      <p className="text-[0.8125rem] font-medium text-ink-3">{label}</p>
      <p className={clsx('num mt-2 truncate text-[1.5rem] leading-tight font-semibold tracking-tight', valueClassName)}>
        {value}
      </p>
      {children}
    </Card>
  )
}
