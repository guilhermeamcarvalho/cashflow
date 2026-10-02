import clsx from 'clsx'
import { CircleAlert, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function Spinner({ className }: { className?: string }) {
  return (
    <div role="status" className={clsx('flex justify-center py-10 text-ink-3', className)}>
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}

/** Placeholder pulsante enquanto os dados carregam. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('card animate-pulse rounded-2xl', className)} aria-hidden />
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-12 text-center">
      <div className="mb-2 flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-3">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<CircleAlert className="size-5 text-critical" aria-hidden />}
      title="Algo deu errado"
      description={message}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" aria-hidden /> Tentar novamente
          </Button>
        )
      }
    />
  )
}
