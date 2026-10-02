import clsx from 'clsx'
import { Link } from 'react-router'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Spinner } from '@/components/ui/Feedback'
import type { TransactionType } from '@/types/api'
import { useCategories } from './api'

interface CategoryPickerProps {
  type: TransactionType
  value: string
  onChange: (categoryId: string) => void
  error?: string
  /** Chamado ao seguir o link "Criar categoria" (ex.: fechar o painel). */
  onNavigate?: () => void
}

/** Grade de categorias do tipo informado, para formulários de lançamento. */
export function CategoryPicker({ type, value, onChange, error, onNavigate }: CategoryPickerProps) {
  const categories = useCategories()
  const options = (categories.data ?? []).filter((category) => category.type === type)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[0.8125rem] font-medium text-ink-2">Categoria</legend>
      {categories.isPending ? (
        <Spinner className="py-4" />
      ) : options.length === 0 ? (
        <p className="text-sm text-ink-3">
          Nenhuma categoria deste tipo.{' '}
          <Link to="/settings/categories" onClick={onNavigate} className="font-medium text-accent hover:underline">
            Criar categoria
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((category) => {
            const selected = category.id === value
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(category.id)}
                className={clsx(
                  'flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors',
                  selected
                    ? 'border-accent bg-accent-soft ring-1 ring-accent'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                )}
              >
                <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                <span className="min-w-0 truncate text-[0.8125rem] font-medium text-ink">{category.name}</span>
              </button>
            )
          })}
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
