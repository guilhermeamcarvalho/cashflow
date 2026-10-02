import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
} & ComponentPropsWithoutRef<T>

/** Superfície base: fundo sólido, borda fina e sombra discreta. */
export function Card<T extends ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Component = as ?? 'div'
  return <Component className={clsx('card rounded-2xl', className)} {...props} />
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/** Cabeçalho de cartão com título, descrição opcional e ação à direita. */
export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[0.8125rem] text-ink-3">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
