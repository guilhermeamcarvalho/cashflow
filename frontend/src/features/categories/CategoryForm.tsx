import clsx from 'clsx'
import { Check, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { CATEGORY_ICON_NAMES, CategoryIcon } from '@/components/ui/CategoryIcon'
import { TextField } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { AppError } from '@/data/errors'
import type { Category, TransactionType } from '@/types/api'
import { useDeleteCategory, useSaveCategory } from './api'

/** Paleta sugerida para categorias (a identidade é sempre reforçada por nome + ícone). */
export const CATEGORY_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#F59E0B',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#0EA5E9', '#3B82F6', '#64748B',
]

const TYPE_OPTIONS = [
  { value: 'EXPENSE' as const, label: 'Despesa' },
  { value: 'INCOME' as const, label: 'Receita' },
]

interface CategoryFormProps {
  category?: Category
  defaultType: TransactionType
  onDone: () => void
}

export function CategoryForm({ category, defaultType, onDone }: CategoryFormProps) {
  const toast = useToast()
  const save = useSaveCategory()
  const remove = useDeleteCategory()
  const [type, setType] = useState<TransactionType>(category?.type ?? defaultType)
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0])
  const [icon, setIcon] = useState(category?.icon ?? 'ellipsis')
  const [error, setError] = useState<string>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Informe o nome')
      return
    }
    try {
      await save.mutateAsync({ id: category?.id, input: { name: name.trim(), type, color, icon } })
      toast.success(category ? 'Categoria atualizada' : 'Categoria criada')
      onDone()
    } catch (err) {
      if (err instanceof AppError && err.fieldErrors.name) setError(err.fieldErrors.name)
      else toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function handleDelete() {
    if (!category) return
    try {
      await remove.mutateAsync(category.id)
      toast.success('Categoria excluída')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={color} size="lg" />
        <div className="flex-1">
          <TextField label="Nome" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} error={error} />
        </div>
      </div>

      {!category && (
        <SegmentedControl label="Tipo da categoria" options={TYPE_OPTIONS} value={type} onChange={setType} />
      )}

      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-medium text-ink-2">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Cor ${swatch}`}
              aria-pressed={swatch === color}
              onClick={() => setColor(swatch)}
              className="flex size-8 items-center justify-center rounded-md text-white ring-offset-2 ring-offset-surface transition-shadow aria-pressed:ring-2 aria-pressed:ring-ink"
              style={{ background: swatch }}
            >
              {swatch === color && <Check className="size-4" strokeWidth={2.75} aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-medium text-ink-2">Ícone</legend>
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
          {CATEGORY_ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={`Ícone ${name}`}
              aria-pressed={name === icon}
              onClick={() => setIcon(name)}
              className={clsx(
                'flex aspect-square items-center justify-center rounded-md border transition-colors',
                name === icon ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2',
              )}
            >
              <CategoryIcon icon={name} color={name === icon ? color : 'var(--ink-3)'} size="sm" plain />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2 border-t border-line pt-5">
        {category && (
          <Button variant="danger" size="lg" onClick={handleDelete} loading={remove.isPending}>
            <Trash2 className="size-4" aria-hidden /> Excluir
          </Button>
        )}
        <Button type="submit" size="lg" block loading={save.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
