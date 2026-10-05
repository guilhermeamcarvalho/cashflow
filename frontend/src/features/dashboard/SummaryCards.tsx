import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Card } from '@/components/ui/Card'
import { BudgetBar, BudgetStatusLabel } from '@/features/budgets/BudgetProgress'
import { formatCurrency, percentChange } from '@/lib/format'
import type { Totals } from '@/types/api'

interface SummaryCardsProps {
  current: Totals
  previous: Totals
  previousLabel: string
  budgeted: number
  budgetSpent: number
}

/** Indicadores do mês: saldo, receitas, despesas e uso do orçamento. */
export function SummaryCards({ current, previous, previousLabel, budgeted, budgetSpent }: SummaryCardsProps) {
  return (
    <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Kpi
        hero
        className="col-span-2 sm:col-span-1"
        label="Saldo do mês"
        value={<AnimatedNumber value={current.balance} format={formatCurrency} />}
        footer={
          <span className="text-white/70">
            {current.balance < 0 ? 'Despesas acima das receitas' : 'Receitas menos despesas'}
          </span>
        }
      />
      <Kpi
        label="Receitas"
        value={<AnimatedNumber value={current.income} format={formatCurrency} />}
        footer={<Delta current={current.income} previous={previous.income} label={previousLabel} higherIsBetter />}
      />
      <Kpi
        label="Despesas"
        value={<AnimatedNumber value={current.expenses} format={formatCurrency} />}
        footer={<Delta current={current.expenses} previous={previous.expenses} label={previousLabel} />}
      />
      <BudgetKpi budgeted={budgeted} spent={budgetSpent} />
    </div>
  )
}

interface KpiProps {
  /** Cartão de destaque (fundo em gradiente, texto claro). */
  hero?: boolean
  className?: string
  label: string
  value: ReactNode
  valueClassName?: string
  footer: ReactNode
}

function Kpi({ hero = false, className, label, value, valueClassName, footer }: KpiProps) {
  return (
    <Card
      className={clsx(
        'animate-rise relative flex flex-col overflow-hidden p-4 sm:p-5',
        hero && 'border-transparent bg-[linear-gradient(135deg,#2453d8_0%,#13307f_55%,#0b1a4a_100%)] text-white shadow-[0_12px_28px_-12px_rgb(31_79_214/0.6)]',
        className,
      )}
    >
      {hero && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/10 blur-2xl"
        />
      )}
      <p className={clsx('text-[0.8125rem] font-medium', hero ? 'text-white/75' : 'text-ink-3')}>{label}</p>
      <p className={clsx('num mt-2 truncate text-lg leading-tight font-semibold tracking-tight sm:text-[1.625rem]', valueClassName)}>
        {value}
      </p>
      <div className="mt-auto pt-3 text-[0.8125rem]">{footer}</div>
    </Card>
  )
}

/** Variação vs mês anterior, com ícone + texto (a cor só reforça). */
function Delta({
  current,
  previous,
  label,
  higherIsBetter = false,
}: {
  current: number
  previous: number
  label: string
  higherIsBetter?: boolean
}) {
  const change = percentChange(current, previous)
  if (change === null) return <span className="text-ink-3">Sem dados em {label}</span>

  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus
  const good = change === 0 ? null : change > 0 === higherIsBetter
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span
        className={clsx(
          'num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium',
          good === null ? 'bg-surface-3 text-ink-2' : good ? 'bg-good/10 text-good' : 'bg-critical/10 text-critical',
        )}
      >
        <Icon className="size-3" strokeWidth={2.5} aria-hidden />
        {Math.abs(change)}%
      </span>
      <span className="text-ink-3">vs {label}</span>
    </span>
  )
}

function BudgetKpi({ budgeted, spent }: { budgeted: number; spent: number }) {
  if (budgeted <= 0) {
    return (
      <Card
        as={Link}
        to="/budgets"
        className="animate-rise group col-span-2 flex flex-col p-4 transition-colors hover:border-line-strong sm:col-span-1 sm:p-5"
      >
        <p className="text-[0.8125rem] font-medium text-ink-3">Orçamento</p>
        <p className="mt-2 text-[0.95rem] font-medium text-ink">Nenhum limite definido</p>
        <span className="mt-auto flex items-center gap-1 pt-3 text-[0.8125rem] font-medium text-accent">
          Definir orçamento
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Card>
    )
  }

  const percent = Math.round((spent / budgeted) * 100)
  return (
    <Card
      as={Link}
      to="/budgets"
      className="animate-rise col-span-2 flex flex-col p-4 transition-colors hover:border-line-strong sm:col-span-1 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.8125rem] font-medium text-ink-3">Orçamento</p>
        <BudgetStatusLabel percentUsed={percent} />
      </div>
      <p className="num mt-2 text-[1.625rem] leading-tight font-semibold tracking-tight">
        {percent}
        <span className="text-base text-ink-3">%</span>
      </p>
      <div className="mt-auto pt-3">
        <BudgetBar percentUsed={percent} label="Uso do orçamento do mês" />
        <p className="num mt-2 truncate text-[0.8125rem] text-ink-3">
          {formatCurrency(spent)} de {formatCurrency(budgeted)}
        </p>
      </div>
    </Card>
  )
}
