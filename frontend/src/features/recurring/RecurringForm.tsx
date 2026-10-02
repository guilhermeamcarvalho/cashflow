import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useMonth } from '@/app/month'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { MoneyInput, parseMoney, TextArea, TextField, toMoneyInput } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { CategoryPicker } from '@/features/categories/CategoryPicker'
import { PaymentPicker, type PaymentValue } from '@/features/creditcards/PaymentPicker'
import { ApiError } from '@/lib/http'
import { formatMonth } from '@/lib/format'
import { defaultDateFor } from '@/lib/month'
import type { RecurringTransaction, TransactionType } from '@/types/api'
import { useDeleteRecurring, useSaveRecurring } from './api'

interface RecurringFormProps {
  recurring?: RecurringTransaction
  onDone: () => void
}

const TYPE_OPTIONS = [
  { value: 'EXPENSE' as const, label: 'Despesa' },
  { value: 'INCOME' as const, label: 'Receita' },
]

/** Nada foi lançado ainda: o próximo lançamento é o do mês inicial. */
const notStarted = (recurring: RecurringTransaction) => recurring.nextDate.slice(0, 7) === recurring.startMonth

export function RecurringForm({ recurring, onDone }: RecurringFormProps) {
  const { month } = useMonth()
  const toast = useToast()
  const save = useSaveRecurring()
  const remove = useDeleteRecurring()

  const canChangeStart = !recurring || notStarted(recurring)
  const [type, setType] = useState<TransactionType>(recurring?.type ?? 'EXPENSE')
  const [amount, setAmount] = useState(recurring ? toMoneyInput(recurring.amount) : '')
  const [description, setDescription] = useState(recurring?.description ?? '')
  const [categoryId, setCategoryId] = useState(recurring?.category.id ?? '')
  // Data do primeiro lançamento (define mês inicial e dia) enquanto nada foi gerado.
  const [firstDate, setFirstDate] = useState(recurring?.nextDate ?? defaultDateFor(month))
  const [day, setDay] = useState(String(recurring?.dayOfMonth ?? ''))
  const [notes, setNotes] = useState(recurring?.notes ?? '')
  const [payment, setPayment] = useState<PaymentValue>({
    method: recurring?.paymentMethod ?? null,
    cardId: recurring?.creditCard?.id ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  function changeType(next: TransactionType) {
    setType(next)
    setCategoryId('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseMoney(amount)
    const dayOfMonth = canChangeStart ? Number(firstDate.slice(8, 10)) : Number(day)
    const nextErrors: Record<string, string> = {}
    if (!(value > 0)) nextErrors.amount = 'Informe um valor maior que zero'
    if (!description.trim()) nextErrors.description = 'Informe a descrição'
    if (!categoryId) nextErrors.categoryId = 'Escolha uma categoria'
    if (canChangeStart && !firstDate) nextErrors.dayOfMonth = 'Informe a data'
    if (!canChangeStart && !(Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31))
      nextErrors.dayOfMonth = 'O dia deve estar entre 1 e 31'
    if (type === 'EXPENSE' && payment.method === 'CREDIT' && !payment.cardId)
      nextErrors.creditCardId = 'Escolha o cartão de crédito'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await save.mutateAsync({
        id: recurring?.id,
        input: {
          categoryId,
          description: description.trim(),
          amount: value,
          dayOfMonth,
          startMonth: canChangeStart ? firstDate.slice(0, 7) : recurring!.startMonth,
          notes: notes.trim() || null,
          paymentMethod: type === 'EXPENSE' ? payment.method : null,
          creditCardId: type === 'EXPENSE' && payment.method === 'CREDIT' ? payment.cardId : null,
        },
      })
      toast.success(recurring ? 'Lançamento fixo atualizado' : 'Lançamento fixo criado')
      onDone()
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors)
      else toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    }
  }

  async function handleDelete() {
    if (!recurring) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await remove.mutateAsync(recurring.id)
      toast.success('Lançamento fixo encerrado')
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao encerrar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {!recurring && (
        <SegmentedControl label="Tipo do lançamento" options={TYPE_OPTIONS} value={type} onChange={changeType} />
      )}

      <MoneyInput label="Valor mensal" value={amount} onChange={setAmount} error={errors.amount} autoFocus={!recurring} />

      <TextField
        label="Descrição"
        placeholder={type === 'EXPENSE' ? 'Ex.: Aluguel' : 'Ex.: Salário'}
        maxLength={140}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />

      <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} error={errors.categoryId} onNavigate={onDone} />

      {canChangeStart ? (
        <DatePicker
          label="Primeiro lançamento"
          value={firstDate}
          onChange={setFirstDate}
          error={errors.dayOfMonth ?? errors.startMonth}
          hint="Repete todo mês neste mesmo dia. Meses já passados são lançados na hora."
        />
      ) : (
        <TextField
          label="Dia do mês"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          error={errors.dayOfMonth}
          hint={`Ativo desde ${formatMonth(recurring!.startMonth).toLowerCase()}. Em meses mais curtos, usa o último dia.`}
        />
      )}

      {type === 'EXPENSE' && (
        <PaymentPicker
          value={payment}
          onChange={setPayment}
          date={canChangeStart ? firstDate : recurring?.nextDate}
          error={errors.creditCardId ?? errors.paymentMethod}
          onNavigate={onDone}
        />
      )}

      <TextArea
        label="Observações (opcional)"
        maxLength={500}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={errors.notes}
      />

      {recurring && (
        <p className="text-[0.8125rem] text-ink-3">
          Alterações valem a partir do próximo lançamento. Os meses já lançados não mudam.
        </p>
      )}

      <div className="flex gap-2 border-t border-line pt-5">
        {recurring && (
          <Button variant="danger" size="lg" onClick={handleDelete} loading={remove.isPending}>
            <Trash2 className="size-4" aria-hidden />
            {confirmDelete ? 'Confirmar' : 'Encerrar'}
          </Button>
        )}
        <Button type="submit" size="lg" block loading={save.isPending}>
          {recurring ? 'Salvar alterações' : 'Criar lançamento fixo'}
        </Button>
      </div>
    </form>
  )
}
