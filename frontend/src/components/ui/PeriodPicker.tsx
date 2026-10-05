import clsx from 'clsx'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { formatMonth, formatShortMonth } from '@/lib/format'
import { addMonths, compareMonths, currentMonth, maxMonth, minMonth, monthsBetween } from '@/lib/month'
import type { YearMonth } from '@/types/api'
import { Button } from './Button'
import { useAnchoredPosition, useDismissOnOutsideClick } from './popover'
import { SegmentedControl } from './SegmentedControl'

/** Valor do filtro: um intervalo de meses ou um mês específico. */
export type PeriodValue = { kind: 'range'; from: YearMonth; to: YearMonth } | { kind: 'month'; month: YearMonth }

interface PeriodPickerProps {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
  /** Mês usado como base dos atalhos ("últimos 6 meses" etc.). */
  reference: YearMonth
  /** Tamanho máximo do intervalo (a série mensal aceita até 24 meses). */
  maxMonths?: number
  className?: string
}

const POPOVER_WIDTH = 360
const POPOVER_MAX_HEIGHT = 680
const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i + 1)

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const ym = (year: number, month: number): YearMonth => `${year}-${String(month).padStart(2, '0')}`
const shortLabel = (month: YearMonth) => `${capitalize(formatShortMonth(month))} ${month.slice(0, 4)}`

/** Texto curto do período, usado no botão do filtro. */
export function describePeriod(value: PeriodValue): string {
  if (value.kind === 'month') return formatMonth(value.month)
  if (value.from === value.to) return formatMonth(value.from)
  const sameYear = value.from.slice(0, 4) === value.to.slice(0, 4)
  return sameYear
    ? `${capitalize(formatShortMonth(value.from))} – ${capitalize(formatShortMonth(value.to))} ${value.to.slice(0, 4)}`
    : `${shortLabel(value.from)} – ${shortLabel(value.to)}`
}

function presetsFor(reference: YearMonth): { label: string; value: PeriodValue }[] {
  const year = Number(reference.slice(0, 4))
  return [
    { label: 'Últimos 6 meses', value: { kind: 'range', from: addMonths(reference, -5), to: reference } },
    { label: 'Últimos 12 meses', value: { kind: 'range', from: addMonths(reference, -11), to: reference } },
    { label: `Ano de ${year}`, value: { kind: 'range', from: ym(year, 1), to: ym(year, 12) } },
    { label: `Ano de ${year - 1}`, value: { kind: 'range', from: ym(year - 1, 1), to: ym(year - 1, 12) } },
  ]
}

const samePeriod = (a: PeriodValue, b: PeriodValue) =>
  a.kind === b.kind &&
  (a.kind === 'month' ? a.month === (b as typeof a).month : a.from === (b as typeof a).from && a.to === (b as typeof a).to)

/**
 * Filtro de período em formato de calendário de meses.
 *
 * - **Período:** 1º clique define o início, o 2º o fim (a prévia acompanha o
 *   ponteiro). Meses que excederiam `maxMonths` ficam desabilitados.
 * - **Mês específico:** um clique escolhe o mês.
 * Teclado: setas movem entre os meses, PageUp/PageDown trocam o ano, Esc fecha.
 */
export function PeriodPicker({ value, onChange, reference, maxMonths = 24, className }: PeriodPickerProps) {
  const dialogId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [open, setOpen] = useState(false)

  // Rascunho editado dentro do calendário; só vira filtro ao "Aplicar".
  const [mode, setMode] = useState<PeriodValue['kind']>(value.kind)
  const [draft, setDraft] = useState<PeriodValue>(value)
  const [anchor, setAnchor] = useState<YearMonth | null>(null) // início escolhido, aguardando o fim
  const [hover, setHover] = useState<YearMonth | null>(null)
  const [viewYear, setViewYear] = useState(() => Number((value.kind === 'month' ? value.month : value.to).slice(0, 4)))

  const position = useAnchoredPosition(triggerRef, open, { maxHeight: POPOVER_MAX_HEIGHT, width: POPOVER_WIDTH })
  const today = currentMonth()

  function openPanel() {
    setMode(value.kind)
    setDraft(value)
    setAnchor(null)
    setHover(null)
    setViewYear(Number((value.kind === 'month' ? value.month : value.to).slice(0, 4)))
    setOpen(true)
  }

  function close(focusTrigger = true) {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }

  function apply(next: PeriodValue) {
    onChange(next)
    close()
  }

  useDismissOnOutsideClick(open, [panelRef, triggerRef], () => close(false))

  // Ao abrir, foca o mês selecionado (ou o primeiro do ano exibido).
  useEffect(() => {
    if (!open) return
    const focusMonth = draft.kind === 'month' ? draft.month : draft.to
    const index = focusMonth.startsWith(String(viewYear)) ? Number(focusMonth.slice(5)) - 1 : 0
    cellRefs.current[index]?.focus({ preventScroll: true })
    // apenas na abertura
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function changeMode(next: PeriodValue['kind']) {
    setMode(next)
    setAnchor(null)
    setHover(null)
    setDraft(
      next === 'month'
        ? { kind: 'month', month: draft.kind === 'month' ? draft.month : draft.to }
        : draft.kind === 'range'
          ? draft
          : { kind: 'range', from: draft.month, to: draft.month },
    )
  }

  function isDisabled(month: YearMonth) {
    return mode === 'range' && anchor !== null && monthsBetween(minMonth(anchor, month), maxMonth(anchor, month)) > maxMonths
  }

  function pick(month: YearMonth) {
    if (isDisabled(month)) return
    if (mode === 'month') {
      setDraft({ kind: 'month', month })
      return
    }
    if (anchor === null) {
      setAnchor(month)
      setDraft({ kind: 'range', from: month, to: month })
    } else {
      setDraft({ kind: 'range', from: minMonth(anchor, month), to: maxMonth(anchor, month) })
      setAnchor(null)
      setHover(null)
    }
  }

  // Intervalo exibido: durante a escolha, a prévia vai do início até o ponteiro.
  const shown: { from: YearMonth; to: YearMonth } =
    draft.kind === 'month'
      ? { from: draft.month, to: draft.month }
      : anchor !== null && hover !== null && !isDisabled(hover)
        ? { from: minMonth(anchor, hover), to: maxMonth(anchor, hover) }
        : { from: draft.from, to: draft.to }

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = cellRefs.current.findIndex((cell) => cell === document.activeElement)
    if (index < 0) return
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }
    if (event.key in moves) {
      event.preventDefault()
      const next = index + moves[event.key]
      if (next < 0 || next > 11) {
        setViewYear((y) => y + (next < 0 ? -1 : 1))
        requestAnimationFrame(() => cellRefs.current[(next + 12) % 12]?.focus())
      } else {
        cellRefs.current[next]?.focus()
      }
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      setViewYear((y) => y + (event.key === 'PageUp' ? -1 : 1))
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const summary =
    draft.kind === 'month'
      ? formatMonth(draft.month)
      : anchor !== null
        ? 'Agora escolha o mês final'
        : `${describePeriod(draft)} · ${monthsBetween(draft.from, draft.to)} ${monthsBetween(draft.from, draft.to) === 1 ? 'mês' : 'meses'}`

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-label={`Período: ${describePeriod(value)}`}
        onClick={() => (open ? close() : openPanel())}
        className={clsx(
          'field flex h-9 items-center gap-2 py-0 text-left text-[0.8125rem] font-medium',
          open && 'border-accent shadow-[0_0_0_3px_var(--accent-ring)]',
          className,
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-ink-3" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{describePeriod(value)}</span>
        <ChevronDown
          aria-hidden
          className={clsx('size-4 shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={dialogId}
            role="dialog"
            aria-label="Escolher período"
            onKeyDown={onPanelKeyDown}
            style={position}
            className="popover animate-pop no-scrollbar fixed z-[70] flex flex-col gap-3.5 overflow-y-auto rounded-2xl p-4"
          >
            <SegmentedControl
              label="Tipo de filtro"
              options={[
                { value: 'range' as const, label: 'Período' },
                { value: 'month' as const, label: 'Mês específico' },
              ]}
              value={mode}
              onChange={changeMode}
            />

            {mode === 'range' && (
              <div className="flex flex-wrap gap-1.5">
                {presetsFor(reference).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => apply(preset.value)}
                    className={clsx(
                      'rounded-md border px-2.5 py-1 text-[0.75rem] font-medium transition-colors',
                      samePeriod(preset.value, value)
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Cabeçalho do ano */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Ano anterior"
                onClick={() => setViewYear((y) => y - 1)}
                className="flex size-8 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="num text-sm font-semibold" aria-live="polite">
                {viewYear}
              </span>
              <button
                type="button"
                aria-label="Próximo ano"
                onClick={() => setViewYear((y) => y + 1)}
                className="flex size-8 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {/* Grade de meses: a faixa do intervalo é contínua em cada linha */}
            <div role="grid" aria-label={`Meses de ${viewYear}`} onKeyDown={onGridKeyDown} className="grid grid-cols-3 gap-y-1.5">
              {MONTH_INDEXES.map((m, i) => {
                const month = ym(viewYear, m)
                const disabled = isDisabled(month)
                const isStart = month === shown.from
                const isEnd = month === shown.to
                const isEdge = isStart || isEnd
                const inRange = compareMonths(month, shown.from) >= 0 && compareMonths(month, shown.to) <= 0
                const column = i % 3
                return (
                  <div
                    key={month}
                    role="gridcell"
                    className={clsx(
                      'p-0',
                      inRange && shown.from !== shown.to && 'bg-accent-soft',
                      inRange && (isStart || column === 0) && 'rounded-l-md',
                      inRange && (isEnd || column === 2) && 'rounded-r-md',
                    )}
                  >
                    <button
                      ref={(el) => {
                        cellRefs.current[i] = el
                      }}
                      type="button"
                      disabled={disabled}
                      aria-pressed={isEdge}
                      aria-label={formatMonth(month)}
                      onClick={() => pick(month)}
                      onPointerEnter={() => anchor !== null && setHover(month)}
                      onFocus={() => anchor !== null && setHover(month)}
                      className={clsx(
                        'relative flex h-9 w-full flex-col items-center justify-center rounded-md text-[0.8125rem] font-medium transition-colors',
                        isEdge
                          ? 'bg-accent text-on-accent'
                          : inRange
                            ? 'text-ink'
                            : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                      )}
                    >
                      {capitalize(formatShortMonth(month))}
                      {month === today && (
                        <span
                          aria-hidden
                          className={clsx('absolute bottom-1 size-1 rounded-full', isEdge ? 'bg-on-accent' : 'bg-accent')}
                        />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
              <p className="text-[0.8125rem] text-ink-2" aria-live="polite">
                {summary}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => close()}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    apply(anchor !== null && draft.kind === 'range' ? { kind: 'range', from: anchor, to: anchor } : draft)
                  }
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
