import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMonth } from '@/app/month'
import { Button } from '@/components/ui/Button'
import { formatMonth } from '@/lib/format'
import { currentMonth } from '@/lib/month'

interface PageHeaderProps {
  title: string
  description?: string
  withMonth?: boolean
  action?: ReactNode
  /** Elemento acima do título (ex.: link de voltar). */
  back?: ReactNode
}

export function PageHeader({ title, description, withMonth = false, action, back }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-[1.75rem] leading-tight font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 truncate text-sm text-ink-3">{description}</p>}
      </div>
      {(withMonth || action) && (
        <div className="flex items-center gap-2">
          {withMonth && <MonthSwitcher />}
          {action}
        </div>
      )}
    </header>
  )
}

/** Seletor do mês de referência compartilhado entre as telas. */
export function MonthSwitcher() {
  const { month, next, previous, isCurrent, setMonth } = useMonth()
  const arrow =
    'flex size-9 shrink-0 items-center justify-center text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink'
  return (
    <div className="flex flex-1 items-center gap-2 md:flex-none">
      <div className="card flex h-9 flex-1 items-center overflow-hidden rounded-xl md:flex-none">
        <button type="button" aria-label="Mês anterior" title="Mês anterior" onClick={previous} className={arrow}>
          <ChevronLeft className="size-4" />
        </button>
        <span
          className="num flex h-full flex-1 items-center justify-center border-x border-line px-3 text-sm font-medium whitespace-nowrap md:min-w-40"
          aria-live="polite"
        >
          {formatMonth(month)}
        </span>
        <button type="button" aria-label="Próximo mês" title="Próximo mês" onClick={next} className={arrow}>
          <ChevronRight className="size-4" />
        </button>
      </div>
      {!isCurrent && (
        <Button variant="secondary" onClick={() => setMonth(currentMonth())}>
          Hoje
        </Button>
      )}
    </div>
  )
}
