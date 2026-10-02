import clsx from 'clsx'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { formatMonth } from '@/lib/format'
import { parseIsoDate, toIsoDate, toYearMonth } from '@/lib/month'
import type { YearMonth } from '@/types/api'
import { useAnchoredPosition, useDismissOnOutsideClick } from './popover'

interface DatePickerProps {
  label: string
  /** Data no formato `YYYY-MM-DD` (vazio = nenhuma). */
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
}

const POPOVER_WIDTH = 320
const POPOVER_MAX_HEIGHT = 420
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const triggerFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
const fullFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "sex., 02 de out. de 2026" → "Sex, 02 de out de 2026". */
function describe(iso: string): string {
  const text = triggerFormat.format(parseIsoDate(iso)).replace(/\./g, '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function shiftDays(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Mantém o dia ao trocar de mês (31/jan + 1 mês → 28/fev). */
function shiftMonths(iso: string, months: number): string {
  const date = parseIsoDate(iso)
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return toIsoDate(target)
}

/** 42 dias (6 semanas, começando no domingo) que cobrem o mês exibido. */
function calendarDays(month: YearMonth): string[] {
  const first = parseIsoDate(`${month}-01`)
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) =>
    toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)),
  )
}

/**
 * Seletor de data com calendário próprio (substitui o `<input type="date">`
 * nativo, que não pode ser estilizado).
 * Teclado: setas movem o dia, PageUp/PageDown trocam o mês, Home/End vão ao
 * início/fim da semana, Enter/Espaço escolhem e Esc fecha.
 */
export function DatePicker({ label, value, onChange, error, hint }: DatePickerProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dayRefs = useRef(new Map<string, HTMLButtonElement>())
  const [open, setOpen] = useState(false)
  const [today] = useState(() => toIsoDate(new Date()))
  const [focused, setFocused] = useState(value || today)
  const viewMonth = toYearMonth(parseIsoDate(focused))

  const position = useAnchoredPosition(triggerRef, open, { maxHeight: POPOVER_MAX_HEIGHT, width: POPOVER_WIDTH })

  function openPanel() {
    setFocused(value || today)
    setOpen(true)
  }

  function close(focusTrigger = true) {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }

  function pick(iso: string) {
    onChange(iso)
    close()
  }

  useDismissOnOutsideClick(open, [panelRef, triggerRef], () => close(false))

  // O dia em foco recebe o foco real do teclado (inclusive ao trocar de mês).
  useEffect(() => {
    if (open) dayRefs.current.get(focused)?.focus({ preventScroll: true })
  }, [open, focused])

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const weekday = parseIsoDate(focused).getDay()
    const moves: Record<string, () => string> = {
      ArrowLeft: () => shiftDays(focused, -1),
      ArrowRight: () => shiftDays(focused, 1),
      ArrowUp: () => shiftDays(focused, -7),
      ArrowDown: () => shiftDays(focused, 7),
      Home: () => shiftDays(focused, -weekday),
      End: () => shiftDays(focused, 6 - weekday),
      PageUp: () => shiftMonths(focused, -1),
      PageDown: () => shiftMonths(focused, 1),
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      setFocused(move())
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      // preventDefault sinaliza ao painel (Sheet) que o Esc já foi tratado aqui.
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const navButton =
    'flex size-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-2">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (open ? close() : openPanel())}
        className={clsx(
          'field flex items-center gap-2.5 text-left',
          open && 'border-accent shadow-[0_0_0_3px_var(--accent-ring)]',
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-ink-3" aria-hidden />
        <span className={clsx('num min-w-0 flex-1 truncate', !value && 'text-ink-3')}>
          {value ? describe(value) : 'Selecione uma data'}
        </span>
        <ChevronDown
          aria-hidden
          className={clsx('size-4 shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[0.8125rem] text-critical">
          {error}
        </p>
      ) : (
        hint && <p className="text-[0.8125rem] text-ink-3">{hint}</p>
      )}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={`Escolher ${label.toLowerCase()}`}
            onKeyDown={onPanelKeyDown}
            style={position}
            className="popover animate-pop no-scrollbar fixed z-[70] overflow-y-auto rounded-2xl p-3"
          >
            {/* Cabeçalho: mês exibido e navegação */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() => setFocused(shiftMonths(focused, -1))}
                className={navButton}
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold text-ink" aria-live="polite">
                {formatMonth(viewMonth)}
              </span>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => setFocused(shiftMonths(focused, 1))}
                className={navButton}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div role="grid" aria-label={formatMonth(viewMonth)} onKeyDown={onGridKeyDown}>
              <div role="row" className="mb-1 grid grid-cols-7">
                {WEEKDAYS.map((day, i) => (
                  <span
                    key={i}
                    role="columnheader"
                    aria-label={WEEKDAY_NAMES[i]}
                    className="flex h-8 items-center justify-center text-[0.6875rem] font-medium text-ink-3"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {calendarDays(viewMonth).map((iso) => {
                  const selected = iso === value
                  const isToday = iso === today
                  const outside = !iso.startsWith(viewMonth)
                  return (
                    <div key={iso} role="gridcell" className="flex justify-center">
                      <button
                        ref={(el) => {
                          if (el) dayRefs.current.set(iso, el)
                          else dayRefs.current.delete(iso)
                        }}
                        type="button"
                        tabIndex={iso === focused ? 0 : -1}
                        aria-selected={selected}
                        aria-current={isToday ? 'date' : undefined}
                        aria-label={fullFormat.format(parseIsoDate(iso))}
                        onClick={() => pick(iso)}
                        className={clsx(
                          'num relative flex size-9 items-center justify-center rounded-xl text-[0.8125rem] font-medium transition-colors',
                          'focus-visible:outline-2 focus-visible:outline-offset-0',
                          selected
                            ? 'bg-accent text-on-accent shadow-[0_4px_10px_-4px_var(--accent)]'
                            : isToday
                              ? 'bg-accent-soft text-accent hover:bg-accent/15'
                              : outside
                                ? 'text-ink-3/60 hover:bg-surface-3 hover:text-ink-2'
                                : 'text-ink hover:bg-surface-3',
                        )}
                      >
                        {Number(iso.slice(8))}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Atalhos */}
            <div className="mt-2 flex items-center gap-1.5 border-t border-line pt-2.5">
              <button
                type="button"
                onClick={() => pick(today)}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => pick(shiftDays(today, -1))}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Ontem
              </button>
              {viewMonth !== today.slice(0, 7) && (
                <button
                  type="button"
                  onClick={() => setFocused(today)}
                  className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-accent hover:underline"
                >
                  Ir para hoje
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
