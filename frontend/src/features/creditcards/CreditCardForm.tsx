import clsx from 'clsx'
import { Check, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { MoneyInput, parseMoney, TextField, toMoneyInput } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { AppError } from '@/data/errors'
import type { CreditCard } from '@/types/api'
import { useDeleteCreditCard, useSaveCreditCard } from './api'

/** Cores comuns de cartões (a identificação é sempre pelo nome). */
export const CARD_COLORS = ['#8A05BE', '#EC7000', '#CC092F', '#0B5ED7', '#111827', '#0F766E', '#B45309', '#475569']

interface CreditCardFormProps {
  card?: CreditCard
  onDone: () => void
}

export function CreditCardForm({ card, onDone }: CreditCardFormProps) {
  const toast = useToast()
  const save = useSaveCreditCard()
  const remove = useDeleteCreditCard()
  const [name, setName] = useState(card?.name ?? '')
  const [color, setColor] = useState(card?.color ?? CARD_COLORS[0])
  const [closingDay, setClosingDay] = useState(String(card?.closingDay ?? ''))
  const [dueDay, setDueDay] = useState(String(card?.dueDay ?? ''))
  const [limit, setLimit] = useState(card?.creditLimit ? toMoneyInput(card.creditLimit) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const validDay = (value: string) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 31

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const creditLimit = limit.trim() ? parseMoney(limit) : null
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome'
    if (!validDay(closingDay)) nextErrors.closingDay = 'Dia entre 1 e 31'
    if (!validDay(dueDay)) nextErrors.dueDay = 'Dia entre 1 e 31'
    if (creditLimit !== null && !(creditLimit > 0)) nextErrors.creditLimit = 'Informe um valor maior que zero'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await save.mutateAsync({
        id: card?.id,
        input: { name: name.trim(), color, closingDay: Number(closingDay), dueDay: Number(dueDay), creditLimit },
      })
      toast.success(card ? 'Cartão atualizado' : 'Cartão cadastrado')
      onDone()
    } catch (error) {
      if (error instanceof AppError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors)
      else if (error instanceof AppError && error.status === 409) setErrors({ name: error.message })
      else toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    }
  }

  async function handleDelete() {
    if (!card) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await remove.mutateAsync(card.id)
      toast.success('Cartão excluído')
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
      setConfirmDelete(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Nome do cartão"
        placeholder="Ex.: Nubank"
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus={!card}
      />

      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-medium text-ink-2">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {CARD_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Cor ${swatch}`}
              aria-pressed={swatch === color}
              onClick={() => setColor(swatch)}
              className={clsx(
                'flex h-8 w-11 items-center justify-center rounded-lg text-white ring-offset-2 ring-offset-surface transition-shadow',
                swatch === color && 'ring-2 ring-ink',
              )}
              style={{ background: swatch }}
            >
              {swatch === color && <Check className="size-4" strokeWidth={2.75} aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Dia de fechamento"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          placeholder="Ex.: 3"
          value={closingDay}
          onChange={(e) => setClosingDay(e.target.value)}
          error={errors.closingDay}
        />
        <TextField
          label="Dia de vencimento"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          placeholder="Ex.: 10"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          error={errors.dueDay}
        />
      </div>
      <p className="-mt-2 text-[0.8125rem] text-ink-3">
        Compras a partir do dia de fechamento entram na fatura seguinte.
        {card && ' Mudanças nos dias valem para as próximas compras.'}
      </p>

      <MoneyInput label="Limite (opcional)" value={limit} onChange={setLimit} error={errors.creditLimit} />

      <div className="flex gap-2 border-t border-line pt-5">
        {card && (
          <Button variant="danger" size="lg" onClick={handleDelete} loading={remove.isPending}>
            <Trash2 className="size-4" aria-hidden />
            {confirmDelete ? 'Confirmar' : 'Excluir'}
          </Button>
        )}
        <Button type="submit" size="lg" block loading={save.isPending}>
          {card ? 'Salvar alterações' : 'Cadastrar cartão'}
        </Button>
      </div>
    </form>
  )
}
