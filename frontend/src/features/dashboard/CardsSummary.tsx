import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardHeader } from '@/components/ui/Card'
import { INVOICE_STATUS_LABELS } from '@/lib/creditCard'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { CreditCard } from '@/types/api'

/**
 * Situação dos cartões: fatura fechada a pagar (quando houver) e a fatura
 * atual de cada cartão, com atalho para a tela de cartões.
 */
export function CardsSummary({ cards, className }: { cards: CreditCard[]; className?: string }) {
  const toPay = cards
    .map((card) => card.previousInvoice)
    .filter((invoice) => invoice.status === 'CLOSED' || invoice.status === 'OVERDUE')
    .reduce((sum, invoice) => sum + invoice.total, 0)

  return (
    <Card className={clsx('animate-rise overflow-hidden', className)}>
      <CardHeader
        title="Cartões de crédito"
        description={toPay > 0 ? `${formatCurrency(toPay)} em faturas fechadas a pagar` : 'Nenhuma fatura fechada a pagar'}
        className="border-b border-line px-5 py-4"
        action={
          <Link to="/cards" className="flex items-center gap-0.5 text-[0.8125rem] font-medium text-accent hover:underline">
            Ver faturas <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        }
      />
      <ul className="divide-y divide-line">
        {cards.map((card) => {
          const pending = card.previousInvoice.status === 'CLOSED' || card.previousInvoice.status === 'OVERDUE'
          const invoice = pending ? card.previousInvoice : card.currentInvoice
          return (
            <li key={card.id}>
              <Link
                to={`/cards?card=${card.id}&month=${invoice.month}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
              >
                <span
                  aria-hidden
                  className="h-7 w-10 shrink-0 rounded-md shadow-xs"
                  style={{ background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 55%, #000))` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{card.name}</span>
                  <span
                    className={clsx(
                      'block truncate text-[0.8125rem]',
                      invoice.status === 'OVERDUE' ? 'text-critical' : 'text-ink-3',
                    )}
                  >
                    {INVOICE_STATUS_LABELS[invoice.status]} ·{' '}
                    {invoice.status === 'OPEN'
                      ? `fecha ${formatShortDate(invoice.closingDate)}`
                      : `vence ${formatShortDate(invoice.dueDate)}`}
                  </span>
                </span>
                <span className="num shrink-0 text-sm font-medium text-ink">{formatCurrency(invoice.total)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
