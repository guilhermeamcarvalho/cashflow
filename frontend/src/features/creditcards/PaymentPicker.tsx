import clsx from 'clsx'
import { Banknote, CreditCard as CreditCardIcon, Landmark, QrCode, Receipt, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Spinner } from '@/components/ui/Feedback'
import { dueDateOf, invoiceFor, PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@/lib/creditCard'
import { formatMonth, formatShortDate } from '@/lib/format'
import type { PaymentMethod } from '@/types/api'
import { useCreditCards } from './api'

export interface PaymentValue {
  method: PaymentMethod | null
  cardId: string
}

export const PAYMENT_ICONS: Record<PaymentMethod, LucideIcon> = {
  PIX: QrCode,
  DEBIT: Landmark,
  CREDIT: CreditCardIcon,
  CASH: Banknote,
  BOLETO: Receipt,
}

interface PaymentPickerProps {
  value: PaymentValue
  onChange: (value: PaymentValue) => void
  /** Data da compra, para mostrar em qual fatura ela entra. */
  date?: string
  /** Número de parcelas da compra (muda o texto da fatura). */
  installments?: number
  error?: string
  /** Chamado ao seguir o link "Cadastrar cartão" (ex.: fechar o painel). */
  onNavigate?: () => void
}

/** Forma de pagamento de uma despesa; no crédito, também o cartão. Clicar de novo desmarca. */
export function PaymentPicker({ value, onChange, date, installments = 1, error, onNavigate }: PaymentPickerProps) {
  const cards = useCreditCards()
  const card = cards.data?.find((item) => item.id === value.cardId)
  const invoice = card && date ? invoiceFor(card, date) : null

  function choose(method: PaymentMethod) {
    if (method === value.method) return onChange({ method: null, cardId: '' })
    // no crédito, já escolhe o cartão quando há só um
    const onlyCard = cards.data?.length === 1 ? cards.data[0].id : ''
    onChange({ method, cardId: method === 'CREDIT' ? value.cardId || onlyCard : '' })
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[0.8125rem] font-medium text-ink-2">
        Pago com <span className="font-normal text-ink-3">(opcional)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((method) => {
          const Icon = PAYMENT_ICONS[method]
          const selected = method === value.method
          return (
            <button
              key={method}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(method)}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                selected
                  ? 'border-accent bg-accent-soft text-accent ring-1 ring-accent'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-2 hover:text-ink',
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          )
        })}
      </div>

      {value.method === 'CREDIT' && (
        <div className="mt-1 rounded-xl border border-line bg-surface-2 p-3">
          <p className="mb-2 text-xs font-medium text-ink-3">Cartão</p>
          {cards.isPending ? (
            <Spinner className="py-2" />
          ) : !cards.data?.length ? (
            <p className="text-sm text-ink-3">
              Nenhum cartão cadastrado.{' '}
              <Link to="/cards" onClick={onNavigate} className="font-medium text-accent hover:underline">
                Cadastrar cartão
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cards.data.map((item) => {
                const selected = item.id === value.cardId
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ method: 'CREDIT', cardId: item.id })}
                    className={clsx(
                      'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                      selected
                        ? 'border-accent bg-surface text-ink ring-1 ring-accent'
                        : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                    )}
                  >
                    <span className="h-3 w-4.5 rounded-[3px]" style={{ background: item.color }} aria-hidden />
                    {item.name}
                  </button>
                )
              })}
            </div>
          )}
          {card && invoice && (
            <p className="mt-2.5 text-[0.8125rem] text-ink-2">
              {installments > 1 ? `A 1ª de ${installments} parcelas entra` : 'Entra'} na fatura de <strong className="font-medium text-ink">{formatMonth(invoice).toLowerCase()}</strong>,
              que vence em {formatShortDate(dueDateOf(card, invoice))}.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-[0.8125rem] text-critical">
          {error}
        </p>
      )}
    </fieldset>
  )
}
