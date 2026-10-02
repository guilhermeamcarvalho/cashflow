import clsx from 'clsx'
import { Check, ChevronLeft, ChevronRight, CreditCard as CreditCardIcon, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { TransactionRow } from '@/features/transactions/TransactionRow'
import { useTransactionSheet } from '@/features/transactions/TransactionSheetContext'
import { INVOICE_STATUS_LABELS } from '@/lib/creditCard'
import { formatCurrency, formatMonth, formatShortDate } from '@/lib/format'
import { addMonths } from '@/lib/month'
import type { CreditCard, InvoiceStatus, InvoiceSummary, YearMonth } from '@/types/api'
import { useCreditCards, useInvoice, useInvoicePayment } from './api'
import { CreditCardForm } from './CreditCardForm'

type FormState = { open: false } | { open: true; card?: CreditCard }

/** Fatura mostrada ao abrir um cartão: a fechada ainda não paga, ou a atual. */
function defaultInvoice(card: CreditCard): YearMonth {
  const previous = card.previousInvoice
  return previous.status === 'CLOSED' || previous.status === 'OVERDUE' ? previous.month : card.currentInvoice.month
}

export default function CreditCardsPage() {
  const query = useCreditCards()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState<FormState>({ open: false })
  const cards = query.data ?? []
  const selected = cards.find((card) => card.id === params.get('card')) ?? cards[0]
  const month = params.get('month') ?? (selected ? defaultInvoice(selected) : '')

  function select(card: CreditCard, invoice: YearMonth = defaultInvoice(card)) {
    setParams({ card: card.id, month: invoice }, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Cartões"
        description="Faturas, limite e compras parceladas dos seus cartões de crédito."
        action={
          <Button onClick={() => setForm({ open: true })}>
            <Plus className="size-4" aria-hidden /> Novo cartão
          </Button>
        }
      />

      {query.isPending ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="aspect-[1.7] rounded-3xl" />
            <Skeleton className="aspect-[1.7] rounded-3xl" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : query.isError ? (
        <Card>
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </Card>
      ) : cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCardIcon className="size-5" aria-hidden />}
            title="Nenhum cartão cadastrado"
            description="Cadastre seus cartões com os dias de fechamento e vencimento. As compras no crédito vão para a fatura certa automaticamente."
            action={<Button onClick={() => setForm({ open: true })}>Cadastrar cartão</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* celular: carrossel horizontal; telas maiores: grade */}
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 xl:grid-cols-3">
            {cards.map((card) => (
              <CardVisual
                key={card.id}
                card={card}
                selected={card.id === selected?.id}
                onSelect={() => select(card)}
              />
            ))}
          </div>

          {selected && month && (
            <InvoicePanel
              card={selected}
              month={month}
              onMonthChange={(next) => select(selected, next)}
              onEdit={() => setForm({ open: true, card: selected })}
            />
          )}
        </div>
      )}

      <Sheet
        open={form.open}
        onClose={() => setForm({ open: false })}
        title={form.open && form.card ? 'Editar cartão' : 'Novo cartão'}
      >
        {form.open && (
          <CreditCardForm key={form.card?.id ?? 'new'} card={form.card} onDone={() => setForm({ open: false })} />
        )}
      </Sheet>
    </>
  )
}

/** Cartão no formato de um cartão físico, com a fatura atual e o limite. */
function CardVisual({ card, selected, onSelect }: { card: CreditCard; selected: boolean; onSelect: () => void }) {
  const used = card.creditLimit && card.availableLimit !== null ? card.creditLimit - card.availableLimit : 0
  const usedPercent = card.creditLimit ? Math.min(100, Math.max(0, (used / card.creditLimit) * 100)) : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        'animate-rise relative flex aspect-[1.7] w-[85%] shrink-0 snap-center flex-col overflow-hidden rounded-3xl p-5 text-left text-white transition-all sm:w-auto',
        'shadow-[0_14px_30px_-14px_rgb(0_0_0/0.55)] hover:-translate-y-0.5',
        selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : 'opacity-90 hover:opacity-100',
      )}
      style={{
        background: `linear-gradient(135deg, ${card.color} 0%, color-mix(in srgb, ${card.color} 55%, #000) 100%)`,
      }}
    >
      <span aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-black/10" />

      <span className="relative flex items-start justify-between gap-3">
        <span className="truncate text-lg font-semibold tracking-tight">{card.name}</span>
        <span aria-hidden className="h-7 w-9 shrink-0 rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80 opacity-90" />
      </span>

      <span className="relative mt-auto">
        <span className="block text-xs text-white/70">Fatura atual · fecha {formatShortDate(card.currentInvoice.closingDate)}</span>
        <span className="num block text-2xl font-semibold tracking-tight">{formatCurrency(card.currentInvoice.total)}</span>
      </span>

      <span className="relative mt-3 flex items-end justify-between gap-3 text-xs text-white/75">
        <span className="min-w-0 flex-1">
          {card.creditLimit ? (
            <>
              <span className="num block truncate">Disponível {formatCurrency(card.availableLimit ?? 0)}</span>
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/20">
                <span className="block h-full rounded-full bg-white" style={{ width: `${usedPercent}%` }} />
              </span>
            </>
          ) : (
            <span>Sem limite informado</span>
          )}
        </span>
        <span className="shrink-0 text-right">Vence dia {card.dueDay}</span>
      </span>
    </button>
  )
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  OPEN: 'bg-accent-soft text-accent',
  CLOSED: 'bg-warning/10 text-warning',
  OVERDUE: 'bg-critical/10 text-critical',
  PAID: 'bg-good/10 text-good',
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status])}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  )
}

interface InvoicePanelProps {
  card: CreditCard
  month: YearMonth
  onMonthChange: (month: YearMonth) => void
  onEdit: () => void
}

function InvoicePanel({ card, month, onMonthChange, onEdit }: InvoicePanelProps) {
  const toast = useToast()
  const { openEdit } = useTransactionSheet()
  const invoice = useInvoice(card.id, month)
  const payment = useInvoicePayment()
  const summary: InvoiceSummary | undefined = invoice.data?.summary

  async function togglePaid(paid: boolean) {
    try {
      await payment.mutateAsync({ cardId: card.id, month, paid })
      toast.success(paid ? 'Fatura marcada como paga' : 'Pagamento desfeito')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar a fatura')
    }
  }

  const arrow = 'flex size-9 items-center justify-center text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink'

  return (
    <Card className="animate-rise overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <span className="h-3 w-4.5 rounded-[3px]" style={{ background: card.color }} aria-hidden />
              Fatura · {card.name}
            </span>
          }
          description={`Fecha dia ${card.closingDay} · vence dia ${card.dueDay}`}
        />
        <div className="flex items-center gap-2">
          <div className="card flex h-9 flex-1 items-center overflow-hidden rounded-xl md:flex-none">
            <button type="button" aria-label="Fatura anterior" onClick={() => onMonthChange(addMonths(month, -1))} className={arrow}>
              <ChevronLeft className="size-4" />
            </button>
            <span className="flex h-full flex-1 items-center justify-center border-x border-line px-3 text-sm font-medium whitespace-nowrap md:min-w-44" aria-live="polite">
              {formatMonth(month)}
            </span>
            <button type="button" aria-label="Próxima fatura" onClick={() => onMonthChange(addMonths(month, 1))} className={arrow}>
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Button variant="secondary" onClick={onEdit} aria-label="Editar cartão" title="Editar cartão">
            <Pencil className="size-4" aria-hidden />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      </div>

      {invoice.isPending ? (
        <div className="p-5">
          <Skeleton className="h-24 border-0 shadow-none" />
        </div>
      ) : invoice.isError ? (
        <ErrorState message={invoice.error.message} onRetry={() => invoice.refetch()} />
      ) : (
        summary && (
          <div className={clsx(invoice.isFetching && 'opacity-70 transition-opacity')}>
            <div className="grid gap-4 border-b border-line bg-surface-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="flex items-center gap-2 text-[0.8125rem] text-ink-3">
                    Total da fatura <StatusBadge status={summary.status} />
                  </p>
                  <p className="num mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight">
                    {formatCurrency(summary.total)}
                  </p>
                </div>
                <Info label="Fechamento" value={formatShortDate(summary.closingDate)} />
                <Info label="Vencimento" value={formatShortDate(summary.dueDate)} />
                {summary.paidOn && <Info label="Paga em" value={formatShortDate(summary.paidOn)} />}
              </div>
              {summary.status === 'PAID' && summary.paidOn ? (
                <Button variant="secondary" onClick={() => togglePaid(false)} loading={payment.isPending}>
                  Desfazer pagamento
                </Button>
              ) : summary.status === 'CLOSED' || summary.status === 'OVERDUE' ? (
                <Button onClick={() => togglePaid(true)} loading={payment.isPending}>
                  <Check className="size-4" aria-hidden /> Marcar como paga
                </Button>
              ) : null}
            </div>

            {invoice.data.transactions.length > 0 ? (
              <ul className="divide-y divide-line">
                {invoice.data.transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} onSelect={openEdit} showDate />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhuma compra nesta fatura"
                description="Compras no crédito com este cartão aparecem aqui automaticamente."
              />
            )}
          </div>
        )
      )}
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.8125rem] text-ink-3">{label}</p>
      <p className="num mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  )
}
