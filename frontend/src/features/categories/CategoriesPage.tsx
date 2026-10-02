import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Sheet } from '@/components/ui/Sheet'
import type { Category, TransactionType } from '@/types/api'
import { useCategories } from './api'
import { CategoryForm } from './CategoryForm'

const TYPE_OPTIONS = [
  { value: 'EXPENSE' as const, label: 'Despesas' },
  { value: 'INCOME' as const, label: 'Receitas' },
]

type FormState = { open: false } | { open: true; category?: Category }

export default function CategoriesPage() {
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [form, setForm] = useState<FormState>({ open: false })
  const query = useCategories(type)

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Organize seus lançamentos por tipo de receita e despesa."
        back={
          <Link
            to="/settings"
            className="mb-2 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden /> Ajustes
          </Link>
        }
        action={
          <Button onClick={() => setForm({ open: true })}>
            <Plus className="size-4" aria-hidden /> Nova categoria
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-line p-3 sm:p-4">
          <SegmentedControl label="Tipo" options={TYPE_OPTIONS} value={type} onChange={setType} className="sm:w-64" />
        </div>

        {query.isPending ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-12 border-0 shadow-none" />
            <Skeleton className="h-12 border-0 shadow-none" />
            <Skeleton className="h-12 border-0 shadow-none" />
          </div>
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : query.data.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria"
            action={<Button onClick={() => setForm({ open: true })}>Criar categoria</Button>}
          />
        ) : (
          <ul className="animate-rise divide-y divide-line">
            {query.data.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => setForm({ open: true, category })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5"
                >
                  <CategoryIcon icon={category.icon} color={category.color} />
                  <span className="flex-1 truncate text-sm font-medium">{category.name}</span>
                  <ChevronRight className="size-4 text-ink-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Sheet
        open={form.open}
        onClose={() => setForm({ open: false })}
        title={form.open && form.category ? 'Editar categoria' : 'Nova categoria'}
      >
        {form.open && (
          <CategoryForm
            key={form.category?.id ?? 'new'}
            category={form.category}
            defaultType={type}
            onDone={() => setForm({ open: false })}
          />
        )}
      </Sheet>
    </>
  )
}
