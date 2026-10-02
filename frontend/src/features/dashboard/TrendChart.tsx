import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { useCssVar } from '@/lib/useCssVar'

export type Metric = 'EXPENSE' | 'INCOME' | 'BOTH'

/** Ponto genérico da série (um mês ou um dia). */
export interface TrendPoint {
  key: string
  /** Rótulo curto do eixo X ("out", "15"). */
  label: string
  /** Rótulo completo do tooltip e da tabela ("Outubro de 2026"). */
  title: string
  income: number
  expenses: number
  balance: number
  /** Ponto em destaque (os demais ficam esmaecidos). */
  highlighted?: boolean
}

interface TrendChartProps {
  points: TrendPoint[]
  metric: Metric
  /** Rótulo do agrupamento para tabela/estatísticas: "mês" ou "dia". */
  unit: 'mês' | 'dia'
  caption: string
  onSelect?: (point: TrendPoint) => void
  selectHint?: string
}

const valueOf = (point: TrendPoint, metric: Metric) => (metric === 'INCOME' ? point.income : point.expenses)

/**
 * Barras de receitas/despesas sobre um único eixo.
 * - Uma métrica: série única (uma cor); o ponto destacado fica opaco e os
 *   demais esmaecidos quando há destaque.
 * - "Comparar": duas séries com cores validadas para daltonismo + legenda.
 * Inclui tooltip, estatísticas em texto e tabela para leitores de tela.
 */
export function TrendChart({ points, metric, unit, caption, onSelect, selectHint }: TrendChartProps) {
  const singleColor = useCssVar('--chart-bar', '#1f4fd6')
  const incomeColor = useCssVar('--series-1', '#2a78d6')
  const expenseColor = useCssVar('--series-2', '#eb6834')
  const gridColor = useCssVar('--chart-grid', 'rgba(0,0,0,0.07)')
  const tickColor = useCssVar('--ink-3', '#667085')
  const cursorColor = useCssVar('--surface-3', '#f1f3f6')

  const data = points.map((point) => ({ ...point, value: valueOf(point, metric) }))
  const hasHighlight = points.some((point) => point.highlighted)
  const dense = points.length > 12
  const clickable = Boolean(onSelect)
  const handleClick = (entry: { payload?: unknown }) => onSelect?.(entry.payload as TrendPoint)

  return (
    <figure>
      {metric === 'BOTH' && (
        <div className="mb-3 flex flex-wrap gap-4 text-[0.8125rem] text-ink-2" aria-hidden>
          <LegendItem color={incomeColor} label="Receitas" />
          <LegendItem color={expenseColor} label="Despesas" />
        </div>
      )}

      <div className="h-72 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
            barCategoryGap={dense ? '14%' : points.length <= 6 ? '28%' : '18%'}
            barGap={2}
          >
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
              interval={points.length <= 6 ? 0 : 'preserveStartEnd'}
              minTickGap={dense ? 10 : 6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip
              cursor={{ fill: cursorColor, radius: 4 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as TrendPoint | undefined
                if (!active || !point) return null
                return (
                  <div className="popover num rounded-lg px-3 py-2.5 text-[0.8125rem]">
                    <p className="mb-1.5 font-medium text-ink">{point.title}</p>
                    {metric === 'BOTH' ? (
                      <>
                        <TooltipRow color={incomeColor} label="Receitas" value={point.income} />
                        <TooltipRow color={expenseColor} label="Despesas" value={point.expenses} />
                        <p className="mt-1.5 border-t border-line pt-1.5 text-ink-2">
                          Saldo: <span className="font-semibold text-ink">{formatCurrency(point.balance)}</span>
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-ink tabular-nums">{formatCurrency(valueOf(point, metric))}</p>
                    )}
                    {selectHint && <p className="mt-1.5 text-xs text-ink-3">{selectHint}</p>}
                  </div>
                )
              }}
            />

            {metric === 'BOTH' ? (
              <>
                <Bar dataKey="income" fill={incomeColor} radius={[4, 4, 0, 0]} maxBarSize={22}
                  onClick={handleClick} className={clickable ? 'cursor-pointer' : undefined} />
                <Bar dataKey="expenses" fill={expenseColor} radius={[4, 4, 0, 0]} maxBarSize={22}
                  onClick={handleClick} className={clickable ? 'cursor-pointer' : undefined} />
              </>
            ) : (
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}
                onClick={handleClick} className={clickable ? 'cursor-pointer' : undefined}>
                {data.map((point) => (
                  <Cell key={point.key} fill={singleColor} fillOpacity={!hasHighlight || point.highlighted ? 1 : 0.4} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <TrendStats points={points} metric={metric} unit={unit} />

      <div className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{unit === 'mês' ? 'Mês' : 'Dia'}</th>
              <th scope="col">Receitas</th>
              <th scope="col">Despesas</th>
              <th scope="col">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.key}>
                <td>{point.title}</td>
                <td>{formatCurrency(point.income)}</td>
                <td>{formatCurrency(point.expenses)}</td>
                <td>{formatCurrency(point.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <p className="flex items-center gap-2 text-ink-2">
      <span className="size-2 rounded-sm" style={{ background: color }} aria-hidden />
      {label}: <span className="font-semibold text-ink">{formatCurrency(value)}</span>
    </p>
  )
}

/** Números-resumo do período, em texto (o gráfico mostra a forma; aqui, os valores). */
function TrendStats({ points, metric, unit }: { points: TrendPoint[]; metric: Metric; unit: 'mês' | 'dia' }) {
  const income = points.reduce((sum, p) => sum + p.income, 0)
  const expenses = points.reduce((sum, p) => sum + p.expenses, 0)

  if (metric === 'BOTH') {
    return (
      <dl className="mt-5 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-3 sm:gap-4">
        <Stat label="Receitas" value={formatCurrency(income)} />
        <Stat label="Despesas" value={formatCurrency(expenses)} />
        <Stat label="Saldo" value={formatCurrency(income - expenses)} />
      </dl>
    )
  }

  const values = points.map((p) => valueOf(p, metric))
  const total = values.reduce((sum, v) => sum + v, 0)
  const peakIndex = values.reduce((best, v, i) => (v > values[best] ? i : best), 0)
  const hasData = total > 0

  return (
    <dl className="mt-5 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-3 sm:gap-4">
      <Stat label="Total" value={formatCurrency(total)} />
      <Stat
        label={unit === 'mês' ? 'Média mensal' : 'Média diária'}
        value={formatCurrency(points.length ? total / points.length : 0)}
      />
      <Stat
        label={unit === 'mês' ? 'Maior mês' : 'Maior dia'}
        value={hasData ? formatCurrency(values[peakIndex]) : '—'}
        hint={hasData ? (unit === 'dia' ? `dia ${points[peakIndex].label}` : points[peakIndex].label) : undefined}
      />
    </dl>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
      <dt className="truncate text-xs text-ink-3">{label}</dt>
      <dd className="num truncate text-[0.95rem] font-semibold sm:mt-0.5">
        {value}
        {hint && <span className="ml-1.5 text-xs font-normal text-ink-3">{hint}</span>}
      </dd>
    </div>
  )
}
