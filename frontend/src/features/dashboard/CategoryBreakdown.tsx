import { useState } from 'react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/lib/format'
import type { CategorySlice } from '@/types/api'

const VISIBLE = 6

/**
 * Ranking de gastos por categoria. Cada linha é identificada pelo nome e
 * ícone (rótulo direto); a cor da categoria é só reforço visual.
 */
export function CategoryBreakdown({ slices }: { slices: CategorySlice[] }) {
  const [expanded, setExpanded] = useState(false)
  const largest = slices[0]?.total ?? 0
  const visible = expanded ? slices : slices.slice(0, VISIBLE)

  return (
    <div>
      <ul className="flex flex-col gap-4">
        {visible.map((slice) => (
          <li key={slice.categoryId} className="flex items-center gap-3">
            <CategoryIcon icon={slice.icon} color={slice.color} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink" title={`${slice.count} lançamento(s)`}>
                  {slice.name}
                </span>
                <span className="num shrink-0 text-sm font-medium text-ink">
                  {formatCurrency(slice.total)}
                  <span className="ml-2 inline-block w-9 text-right text-xs font-normal text-ink-3">{slice.percent}%</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-fluid"
                  style={{ width: `${largest > 0 ? (slice.total / largest) * 100 : 0}%`, background: slice.color }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {slices.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-5 w-full rounded-md py-1.5 text-center text-[0.8125rem] font-medium text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
        >
          {expanded ? 'Mostrar menos' : `Ver todas as ${slices.length} categorias`}
        </button>
      )}
    </div>
  )
}
