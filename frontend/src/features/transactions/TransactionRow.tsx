import clsx from 'clsx'
import { Repeat } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { PAYMENT_ICONS } from '@/features/creditcards/PaymentPicker'
import { PAYMENT_METHOD_LABELS } from '@/lib/creditCard'
import { formatShortDate, formatSigned } from '@/lib/format'
import type { Transaction } from '@/types/api'

interface TransactionRowProps {
  transaction: Transaction
  onSelect: (transaction: Transaction) => void
  showDate?: boolean
}

export function TransactionRow({ transaction, onSelect, showDate = false }: TransactionRowProps) {
  const { category } = transaction
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(transaction)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5"
      >
        <CategoryIcon icon={category.icon} color={category.color} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <span className="truncate">{transaction.description}</span>
            {(transaction.installmentCount ?? 0) > 1 && (
              <span className="num shrink-0 rounded-md bg-surface-3 px-1.5 py-px text-[0.6875rem] font-medium text-ink-2">
                {transaction.installmentNumber}/{transaction.installmentCount}
              </span>
            )}
            {transaction.recurringId && (
              <Repeat className="size-3.5 shrink-0 text-ink-3" aria-label="Lançamento fixo" />
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-ink-3">
            <span className="truncate">{category.name}</span>
            <PaymentTag transaction={transaction} />
            {showDate && <span className="shrink-0 sm:hidden">· {formatShortDate(transaction.date)}</span>}
          </span>
        </span>
        {showDate && (
          <span className="num hidden w-20 shrink-0 text-right text-[0.8125rem] text-ink-3 sm:block">
            {formatShortDate(transaction.date)}
          </span>
        )}
        <span
          className={clsx(
            'num w-28 shrink-0 text-right text-sm font-medium',
            transaction.type === 'INCOME' ? 'text-income' : 'text-ink',
          )}
        >
          {formatSigned(transaction.amount, transaction.type)}
        </span>
      </button>
    </li>
  )
}

/** Cartão (com a cor) ou forma de pagamento, discreto ao lado da categoria. */
function PaymentTag({ transaction }: { transaction: Transaction }) {
  if (transaction.creditCard) {
    return (
      <span className="flex shrink-0 items-center gap-1">
        ·
        <span className="h-2 w-3 rounded-[2px]" style={{ background: transaction.creditCard.color }} aria-hidden />
        <span className="max-w-28 truncate">{transaction.creditCard.name}</span>
      </span>
    )
  }
  if (!transaction.paymentMethod) return null
  const Icon = PAYMENT_ICONS[transaction.paymentMethod]
  return (
    <span className="flex shrink-0 items-center gap-1">
      · <Icon className="size-3" aria-hidden />
      <span className="hidden sm:inline">{PAYMENT_METHOD_LABELS[transaction.paymentMethod]}</span>
    </span>
  )
}
