import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyInput, parseMoney, toMoneyInput } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { useCategories } from '@/features/categories/api'
import { formatMonth } from '@/lib/format'
import type { Budget, YearMonth } from '@/types/api'
import { useDeleteBudget, useSaveBudget } from './api'

interface BudgetFormProps {
  month: YearMonth
  budget?: Budget
  /** Categorias que já têm orçamento no mês (não aparecem para novo cadastro). */
  usedCategoryIds: string[]
  onDone: () => void
}

export function BudgetForm({ month, budget, usedCategoryIds, onDone }: BudgetFormProps) {
  const toast = useToast()
  const categories = useCategories('EXPENSE')
  const save = useSaveBudget()
  const remove = useDeleteBudget()
  const [categoryId, setCategoryId] = useState(budget?.category.id ?? '')
  const [amount, setAmount] = useState(budget ? toMoneyInput(budget.amount) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const available = (categories.data ?? []).filter(
    (category) => category.id === budget?.category.id || !usedCategoryIds.includes(category.id),
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseMoney(amount)
    const nextErrors: Record<string, string> = {}
    if (!categoryId) nextErrors.categoryId = 'Escolha uma categoria'
    if (!(value > 0)) nextErrors.amount = 'Informe um valor maior que zero'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await save.mutateAsync({ categoryId, month, amount: value })
      toast.success('Orçamento salvo')
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    }
  }

  async function handleDelete() {
    if (!budget) return
    try {
      await remove.mutateAsync(budget.id)
      toast.success('Orçamento removido')
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <p className="text-sm text-ink-2">
        Limite de gasto para <strong className="text-ink">{formatMonth(month)}</strong>.
      </p>

      <Select
        label="Categoria de despesa"
        placeholder="Selecione uma categoria"
        value={categoryId}
        onChange={setCategoryId}
        disabled={Boolean(budget)}
        error={errors.categoryId}
        options={available.map((category) => ({
          value: category.id,
          label: category.name,
          icon: <CategoryIcon icon={category.icon} color={category.color} size="xs" />,
        }))}
      />

      <MoneyInput label="Limite mensal" value={amount} onChange={setAmount} error={errors.amount} />

      <div className="flex gap-2 border-t border-line pt-5">
        {budget && (
          <Button variant="danger" size="lg" onClick={handleDelete} loading={remove.isPending}>
            <Trash2 className="size-4" aria-hidden /> Remover
          </Button>
        )}
        <Button type="submit" size="lg" block loading={save.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
