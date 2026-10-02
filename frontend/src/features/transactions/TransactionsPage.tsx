import clsx from 'clsx'
import { Plus, Repeat, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMonth } from '@/app/month'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useCreditCards } from '@/features/creditcards/api'
import { PAYMENT_ICONS } from '@/features/creditcards/PaymentPicker'
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@/lib/creditCard'
import { formatCurrency, formatDayHeading } from '@/lib/format'
import type { PaymentMethod, Transaction, TransactionType } from '@/types/api'
import { useTransactions } from './api'
import { TransactionRow } from './TransactionRow'
import { useTransactionSheet } from './TransactionSheetContext'

type Filter = 'ALL' | TransactionType

const FILTERS = [
  { value: 'ALL' as const, label: 'Todos' },
  { value: 'EXPENSE' as const, label: 'Despesas' },
  { value: 'INCOME' as const, label: 'Receitas' },
]

const PAGE_SIZE = 50

export default function TransactionsPage() {
  const { month } = useMonth()
  const { openCreate, openEdit } = useTransactionSheet()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [search, setSearch] = useState('')
  // "" = todas; "PIX" etc. = forma de pagamento; "card:<id>" = um cartão
  const [payment, setPayment] = useState('')
  const cards = useCreditCards()
  const [size, setSize] = useState(PAGE_SIZE)
  const deferredSearch = useDeferredValue(search.trim())

  const query = useTransactions({
    month,
    type: filter === 'ALL' ? undefined : filter,
    search: deferredSearch || undefined,
    paymentMethod: payment && !payment.startsWith('card:') ? (payment as PaymentMethod) : undefined,
    creditCardId: payment.startsWith('card:') ? payment.slice(5) : undefined,
    size,
  })

  const groups = useMemo(() => groupByDay(query.data?.content ?? []), [query.data])
  const page = query.data

  return (
    <>
      <PageHeader
        title="Lançamentos"
        description="Todas as receitas e despesas registradas no mês."
        withMonth
        action={
          <>
            <Link
              to="/recurring"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
            >
              <Repeat className="size-4" aria-hidden /> Fixos
            </Link>
            <Button onClick={openCreate} className="hidden lg:inline-flex">
              <Plus className="size-4" aria-hidden /> Novo
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        {/* Barra de filtros */}
        <div className="flex flex-col gap-2.5 border-b border-line p-3 sm:flex-row sm:items-center sm:p-4">
          <label className="field flex h-9 items-center gap-2 py-0 sm:max-w-xs">
            <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pela descrição"
              aria-label="Buscar lançamentos"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <div className="sm:ml-auto sm:w-56">
            <Select
              variant="pill"
              ariaLabel="Forma de pagamento"
              value={payment}
              onChange={setPayment}
              options={[
                { value: '', label: 'Todas as formas' },
                ...PAYMENT_METHODS.map((method) => {
                  const Icon = PAYMENT_ICONS[method]
                  return {
                    value: method,
                    label: method === 'CREDIT' ? 'Crédito (todos os cartões)' : PAYMENT_METHOD_LABELS[method],
                    icon: <Icon className="size-4 text-ink-3" aria-hidden />,
                  }
                }),
                ...(cards.data ?? []).map((card) => ({
                  value: `card:${card.id}`,
                  label: card.name,
                  icon: <span className="block h-3 w-4.5 rounded-[3px]" style={{ background: card.color }} aria-hidden />,
                })),
              ]}
            />
          </div>
          <SegmentedControl
            label="Filtrar por tipo"
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            className="sm:w-72"
          />
        </div>

        {query.isPending ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-12 border-0 shadow-none" />
            <Skeleton className="h-12 border-0 shadow-none" />
            <Skeleton className="h-12 border-0 shadow-none" />
          </div>
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : groups.length === 0 ? (
          <EmptyState
            title={deferredSearch ? 'Nada encontrado' : 'Nenhum lançamento neste mês'}
            description={deferredSearch ? 'Tente outro termo de busca.' : 'Registre receitas e despesas para acompanhar seu mês.'}
            action={!deferredSearch && <Button onClick={openCreate}>Adicionar lançamento</Button>}
          />
        ) : (
          <div className={clsx(query.isFetching && 'opacity-70 transition-opacity')}>
            {groups.map((group) => (
              <section key={group.date} className="animate-rise">
                <div className="flex items-baseline justify-between border-b border-line bg-surface-2 px-4 py-2 sm:px-5">
                  <h2 className="text-xs font-medium text-ink-2">{formatDayHeading(group.date)}</h2>
                  <span className={clsx('num text-xs font-medium', group.net > 0 ? 'text-income' : 'text-ink-3')}>
                    {formatDayNet(group.net)}
                  </span>
                </div>
                <ul className="divide-y divide-line border-b border-line last:border-b-0">
                  {group.items.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} onSelect={openEdit} />
                  ))}
                </ul>
              </section>
            ))}

            {page && page.totalElements > page.content.length && (
              <div className="flex justify-center border-t border-line p-3">
                <Button
                  variant="ghost"
                  loading={query.isFetching}
                  onClick={() => setSize((current) => current + PAGE_SIZE)}
                >
                  Carregar mais ({page.totalElements - page.content.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}

interface DayGroup {
  date: string
  net: number
  items: Transaction[]
}

function groupByDay(transactions: Transaction[]): DayGroup[] {
  const groups = new Map<string, DayGroup>()
  for (const transaction of transactions) {
    const group = groups.get(transaction.date) ?? { date: transaction.date, net: 0, items: [] }
    group.items.push(transaction)
    group.net += transaction.type === 'INCOME' ? transaction.amount : -transaction.amount
    groups.set(transaction.date, group)
  }
  return [...groups.values()]
}

function formatDayNet(net: number): string {
  if (net === 0) return formatCurrency(0)
  return `${net > 0 ? '+' : '−'}${formatCurrency(Math.abs(net))}`
}
