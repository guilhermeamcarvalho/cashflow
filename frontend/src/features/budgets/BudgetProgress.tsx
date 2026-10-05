import clsx from 'clsx'
import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from 'lucide-react'

export type BudgetStatus = 'good' | 'warning' | 'critical'

interface StatusMeta {
  label: string
  icon: LucideIcon
  text: string
  bar: string
}

/** Status sempre exibido com ícone + rótulo (nunca apenas pela cor). */
const STATUS: Record<BudgetStatus, StatusMeta> = {
  good: { label: 'Dentro do limite', icon: CircleCheck, text: 'text-good', bar: 'bg-good' },
  warning: { label: 'Perto do limite', icon: TriangleAlert, text: 'text-warning', bar: 'bg-warning' },
  critical: { label: 'Limite estourado', icon: CircleAlert, text: 'text-critical', bar: 'bg-critical' },
}

export function budgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed > 100) return 'critical'
  if (percentUsed >= 80) return 'warning'
  return 'good'
}

export function BudgetStatusLabel({ percentUsed, className }: { percentUsed: number; className?: string }) {
  const meta = STATUS[budgetStatus(percentUsed)]
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap', meta.text, className)}>
      <meta.icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  )
}

/** Barra fina de consumo do orçamento (limitada visualmente a 100%). */
export function BudgetBar({ percentUsed, label }: { percentUsed: number; label: string }) {
  const meta = STATUS[budgetStatus(percentUsed)]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(percentUsed, 100)}
      aria-valuetext={`${percentUsed}% usado`}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
    >
      <div
        className={clsx('animate-grow h-full rounded-full transition-[width] duration-700 ease-fluid', meta.bar)}
        style={{ width: `${Math.min(percentUsed, 100)}%` }}
      />
    </div>
  )
}
