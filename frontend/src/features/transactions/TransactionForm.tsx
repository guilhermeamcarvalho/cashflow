import { CreditCard, Repeat, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useMonth } from '@/app/month'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { MoneyInput, parseMoney, TextArea, TextField, toMoneyInput } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { CategoryPicker } from '@/features/categories/CategoryPicker'
import { PaymentPicker, type PaymentValue } from '@/features/creditcards/PaymentPicker'
import { useSaveRecurring } from '@/features/recurring/api'
import { ApiError } from '@/lib/http'
import { formatCurrency, formatMonth } from '@/lib/format'
import { defaultDateFor } from '@/lib/month'
import type { Transaction, TransactionType } from '@/types/api'
import { useDeleteTransaction, useSaveTransaction } from './api'

interface TransactionFormProps {
  transaction?: Transaction
  onDone: () => void
}

const TYPE_OPTIONS = [
  { value: 'EXPENSE' as const, label: 'Despesa' },
  { value: 'INCOME' as const, label: 'Receita' },
]

const MAX_INSTALLMENTS = 24

export function TransactionForm({ transaction, onDone }: TransactionFormProps) {
  const { month } = useMonth()
  const toast = useToast()
  const save = useSaveTransaction()
  const saveRecurring = useSaveRecurring()
  const remove = useDeleteTransaction()

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'EXPENSE')
  const [amount, setAmount] = useState(transaction ? toMoneyInput(transaction.amount) : '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.category.id ?? '')
  const [date, setDate] = useState(transaction?.date ?? defaultDateFor(month))
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [payment, setPayment] = useState<PaymentValue>({
    method: transaction?.paymentMethod ?? null,
    cardId: transaction?.creditCard?.id ?? '',
  })
  const [installments, setInstallments] = useState('1')
  const [repeat, setRepeat] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fixedLabel = type === 'EXPENSE' ? 'despesa fixa' : 'receita fixa'
  const isInstallment = (transaction?.installmentCount ?? 0) > 1
  const canSplit = !transaction && !repeat && type === 'EXPENSE' && payment.method === 'CREDIT'
  const count = canSplit ? Number(installments) : 1
  const total = parseMoney(amount)

  function changeType(next: TransactionType) {
    setType(next)
    setCategoryId('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseMoney(amount)
    const nextErrors: Record<string, string> = {}
    if (!(value > 0)) nextErrors.amount = 'Informe um valor maior que zero'
    if (!description.trim()) nextErrors.description = 'Informe a descrição'
    if (!categoryId) nextErrors.categoryId = 'Escolha uma categoria'
    if (!date) nextErrors.date = 'Informe a data'
    if (type === 'EXPENSE' && payment.method === 'CREDIT' && !payment.cardId)
      nextErrors.creditCardId = 'Escolha o cartão de crédito'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const paymentInput =
      type === 'EXPENSE'
        ? { paymentMethod: payment.method, creditCardId: payment.method === 'CREDIT' ? payment.cardId : null }
        : { paymentMethod: null, creditCardId: null }
    const base = { categoryId, description: description.trim(), amount: value, notes: notes.trim() || null, ...paymentInput }
    try {
      if (repeat) {
        await saveRecurring.mutateAsync({
          input: { ...base, dayOfMonth: Number(date.slice(8, 10)), startMonth: date.slice(0, 7) },
        })
        toast.success(type === 'EXPENSE' ? 'Despesa fixa criada' : 'Receita fixa criada')
      } else {
        await save.mutateAsync({
          id: transaction?.id,
          input: { ...base, date, installments: count > 1 ? count : undefined },
        })
        toast.success(
          transaction ? 'Lançamento atualizado' : count > 1 ? `Compra parcelada em ${count}x` : 'Lançamento adicionado',
        )
      }
      onDone()
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors)
      else toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    }
  }

  async function handleDelete(allInstallments = false) {
    if (!transaction) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await remove.mutateAsync({ id: transaction.id, allInstallments })
      toast.success(allInstallments ? 'Parcelas excluídas' : 'Lançamento excluído')
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {transaction?.recurringId && (
        <Notice icon={<Repeat className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />}>
          Gerado por um lançamento fixo. Alterações aqui valem só para este mês.{' '}
          <Link to="/recurring" onClick={onDone} className="font-medium text-accent hover:underline">
            Gerenciar fixos
          </Link>
        </Notice>
      )}
      {isInstallment && (
        <Notice icon={<CreditCard className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />}>
          Parcela {transaction!.installmentNumber} de {transaction!.installmentCount}
          {transaction!.invoiceMonth && <> · fatura de {formatMonth(transaction!.invoiceMonth).toLowerCase()}</>}.
          Alterações aqui valem só para esta parcela.
        </Notice>
      )}

      {!isInstallment && (
        <SegmentedControl label="Tipo do lançamento" options={TYPE_OPTIONS} value={type} onChange={changeType} />
      )}

      <MoneyInput
        label={count > 1 ? 'Valor total da compra' : 'Valor'}
        value={amount}
        onChange={setAmount}
        error={errors.amount}
        autoFocus={!transaction}
      />

      <TextField
        label="Descrição"
        placeholder={type === 'EXPENSE' ? 'Ex.: Mercado' : 'Ex.: Salário'}
        maxLength={140}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />

      <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} error={errors.categoryId} onNavigate={onDone} />

      <DatePicker
        label={repeat ? 'Primeiro lançamento' : count > 1 ? 'Data da compra' : 'Data'}
        value={date}
        onChange={setDate}
        error={errors.date ?? errors.startMonth ?? errors.dayOfMonth}
      />

      {type === 'EXPENSE' && (
        <PaymentPicker
          value={payment}
          onChange={setPayment}
          date={date}
          installments={count}
          error={errors.creditCardId ?? errors.paymentMethod}
          onNavigate={onDone}
        />
      )}

      {canSplit && (
        <Select
          label="Parcelas"
          value={installments}
          onChange={setInstallments}
          error={errors.installments}
          options={Array.from({ length: MAX_INSTALLMENTS }, (_, i) => {
            const n = i + 1
            return {
              value: String(n),
              label: n === 1 ? 'À vista' : total > 0 ? `${n}x de ${formatCurrency(Math.floor((total / n) * 100) / 100)}` : `${n}x`,
            }
          })}
        />
      )}

      {!transaction && count === 1 && (
        <Switch
          checked={repeat}
          onChange={setRepeat}
          label={`Repetir todo mês (${fixedLabel})`}
          description={
            repeat && date
              ? `Lançada automaticamente todo dia ${Number(date.slice(8, 10))}, a partir de ${formatMonth(date.slice(0, 7)).toLowerCase()}.`
              : 'Ideal para aluguel, assinaturas, contas e salário.'
          }
          className="rounded-xl border border-line px-3.5 py-3"
        />
      )}

      <TextArea
        label="Observações (opcional)"
        maxLength={500}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={errors.notes}
      />

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        {transaction &&
          (isInstallment && confirmDelete ? (
            <>
              <Button variant="danger" size="lg" onClick={() => handleDelete(false)} loading={remove.isPending}>
                <Trash2 className="size-4" aria-hidden /> Só esta parcela
              </Button>
              <Button variant="danger" size="lg" onClick={() => handleDelete(true)} loading={remove.isPending}>
                Todas as {transaction.installmentCount}
              </Button>
            </>
          ) : (
            <Button variant="danger" size="lg" onClick={() => handleDelete(false)} loading={remove.isPending}>
              <Trash2 className="size-4" aria-hidden />
              {confirmDelete ? 'Confirmar' : 'Excluir'}
            </Button>
          ))}
        <Button type="submit" size="lg" block className="min-w-40 flex-1" loading={save.isPending || saveRecurring.isPending}>
          {transaction
            ? 'Salvar alterações'
            : repeat
              ? `Criar ${fixedLabel}`
              : count > 1
                ? `Parcelar em ${count}x`
                : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}

function Notice({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[0.8125rem] text-ink-2">
      {icon}
      <p>{children}</p>
    </div>
  )
}
