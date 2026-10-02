import clsx from 'clsx'
import { ChevronRight, Plus, Repeat } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Sheet } from '@/components/ui/Sheet'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { RecurringTransaction, TransactionType } from '@/types/api'
import { useRecurringTransactions } from './api'
import { RecurringForm } from './RecurringForm'

type FormState = { open: false } | { open: true; recurring?: RecurringTransaction }

const SECTIONS: { type: TransactionType; title: string }[] = [
  { type: 'EXPENSE', title: 'Despesas fixas' },
  { type: 'INCOME', title: 'Receitas fixas' },
]

export default function RecurringPage() {
  const query = useRecurringTransactions()
  const [form, setForm] = useState<FormState>({ open: false })
  const items = query.data ?? []

  const total = (type: TransactionType) =>
    items.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0)
  const expenses = total('EXPENSE')
  const income = total('INCOME')

  return (
    <>
      <PageHeader
        title="Lançamentos fixos"
        description="Despesas e receitas que se repetem todo mês, lançadas automaticamente."
        action={
          <Button onClick={() => setForm({ open: true })}>
            <Plus className="size-4" aria-hidden /> Novo fixo
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
          <Skeleton className="h-64" />
        </div>
      ) : query.isError ? (
        <Card>
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Repeat className="size-5" aria-hidden />}
            title="Nenhum lançamento fixo"
            description="Cadastre aluguel, assinaturas, contas e salário uma única vez. Eles serão lançados todo mês automaticamente."
            action={<Button onClick={() => setForm({ open: true })}>Cadastrar lançamento fixo</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Despesas fixas por mês" value={formatCurrency(expenses)} />
            <Stat label="Receitas fixas por mês" value={formatCurrency(income)} />
            <Stat
              label="Saldo fixo mensal"
              value={formatCurrency(income - expenses)}
              valueClassName={income - expenses < 0 ? 'text-expense' : undefined}
            />
          </div>

          {SECTIONS.map(({ type, title }) => {
            const list = items.filter((item) => item.type === type)
            if (list.length === 0) return null
            return (
              <Card key={type} className="animate-rise overflow-hidden">
                <CardHeader
                  title={title}
                  description={`${list.length} ${list.length === 1 ? 'item' : 'itens'} · ${formatCurrency(total(type))} por mês`}
                  className="border-b border-line px-5 py-4"
                />
                <ul className="divide-y divide-line">
                  {list.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setForm({ open: true, recurring: item })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5"
                      >
                        <CategoryIcon icon={item.category.icon} color={item.category.color} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{item.description}</span>
                          <span className="block truncate text-[0.8125rem] text-ink-3">
                            {item.category.name} · todo dia {item.dayOfMonth}
                          </span>
                        </span>
                        <span className="hidden w-32 shrink-0 text-right text-[0.8125rem] text-ink-3 sm:block">
                          Próximo: <span className="num text-ink-2">{formatShortDate(item.nextDate)}</span>
                        </span>
                        <span
                          className={clsx(
                            'num w-28 shrink-0 text-right text-sm font-medium',
                            type === 'INCOME' ? 'text-income' : 'text-ink',
                          )}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                        <ChevronRight className="hidden size-4 shrink-0 text-ink-3 sm:block" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      )}

      <Sheet
        open={form.open}
        onClose={() => setForm({ open: false })}
        title={form.open && form.recurring ? 'Editar lançamento fixo' : 'Novo lançamento fixo'}
      >
        {form.open && (
          <RecurringForm
            key={form.recurring?.id ?? 'new'}
            recurring={form.recurring}
            onDone={() => setForm({ open: false })}
          />
        )}
      </Sheet>
    </>
  )
}

function Stat({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Card className="animate-rise p-5">
      <p className="text-[0.8125rem] font-medium text-ink-3">{label}</p>
      <p className={clsx('num mt-2 truncate text-[1.5rem] leading-tight font-semibold tracking-tight', valueClassName)}>
        {value}
      </p>
    </Card>
  )
}
