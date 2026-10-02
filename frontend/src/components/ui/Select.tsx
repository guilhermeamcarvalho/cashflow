import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAnchoredPosition, useDismissOnOutsideClick } from './popover'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Rótulo visível acima do campo (formulários). */
  label?: string
  /** Rótulo acessível quando não há rótulo visível (filtros). */
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  /** `field`: campo de formulário; `pill`: filtro compacto arredondado. */
  variant?: 'field' | 'pill'
  className?: string
}

const LIST_MAX_HEIGHT = 288

/**
 * Dropdown estilizado (substitui o <select> nativo, cuja lista não pode
 * ser estilizada). Segue o padrão ARIA "select-only combobox":
 * - Enter/Espaço/↓/↑ abrem; ↑/↓/Home/End navegam; Enter/Espaço escolhem;
 * - Esc fecha; digitar uma letra pula para a opção correspondente.
 * A lista é renderizada num portal com posição fixa, então não é cortada por
 * contêineres com rolagem (ex.: o painel inferior) e abre para cima quando
 * falta espaço abaixo.
 */
export function Select({
  value,
  onChange,
  options,
  label,
  ariaLabel,
  placeholder = 'Selecione…',
  disabled = false,
  error,
  variant = 'field',
  className,
}: SelectProps) {
  const id = useId()
  const listId = `${id}-list`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const position = useAnchoredPosition(triggerRef, open, { maxHeight: LIST_MAX_HEIGHT, minWidth: 200 })
  const typeahead = useRef({ text: '', timer: 0 })

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = options[selectedIndex]

  const openList = useCallback(
    (index = selectedIndex >= 0 ? selectedIndex : 0) => {
      if (disabled) return
      setActiveIndex(index)
      setOpen(true)
    },
    [disabled, selectedIndex],
  )

  const close = useCallback((focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close()
  }

  // Ao abrir, o foco vai para a lista (navegação por teclado).
  useLayoutEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true })
  }, [open])

  useDismissOnOutsideClick(open, [listRef, triggerRef], () => close(false))

  // Mantém a opção ativa visível.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    document.getElementById(`${id}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, id])

  function jumpByTyping(key: string) {
    const state = typeahead.current
    window.clearTimeout(state.timer)
    state.text += key.toLowerCase()
    state.timer = window.setTimeout(() => (state.text = ''), 600)
    const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    const match = options.findIndex((option) => normalize(option.label).startsWith(normalize(state.text)))
    if (match >= 0) setActiveIndex(match)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openList(event.key === 'ArrowUp' ? Math.max(selectedIndex, 0) : undefined)
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, last))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(last)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(activeIndex)
        break
      case 'Escape':
        // preventDefault sinaliza ao painel (Sheet) que o Esc já foi tratado aqui.
        event.preventDefault()
        event.stopPropagation()
        close()
        break
      case 'Tab':
        close(false)
        break
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) jumpByTyping(event.key)
    }
  }

  const trigger = (
    <button
      ref={triggerRef}
      id={`${id}-trigger`}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? `${id}-label ${id}-trigger` : undefined}
      aria-invalid={error ? true : undefined}
      disabled={disabled}
      onClick={() => (open ? close() : openList())}
      onKeyDown={onTriggerKeyDown}
      className={clsx(
        'field flex items-center gap-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'pill' ? 'h-9 py-0 text-[0.8125rem] font-medium' : 'min-h-10',
        open && 'border-accent shadow-[0_0_0_3px_var(--accent-ring)]',
        className,
      )}
    >
      {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
      <span className={clsx('min-w-0 flex-1 truncate', !selected && 'text-ink-3')}>
        {selected?.label ?? placeholder}
      </span>
      <ChevronDown
        aria-hidden
        className={clsx('size-4 shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
      />
    </button>
  )

  return (
    <div className={clsx(label && 'flex flex-col gap-1.5')}>
      {label && (
        <span id={`${id}-label`} className="text-[0.8125rem] font-medium text-ink-2">
          {label}
        </span>
      )}
      {trigger}
      {error && (
        <p role="alert" className="text-[0.8125rem] text-critical">
          {error}
        </p>
      )}

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={label ? `${id}-label` : undefined}
            aria-label={label ? undefined : ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
            onKeyDown={onListKeyDown}
            style={position}
            className="popover animate-pop no-scrollbar fixed z-[70] overflow-y-auto rounded-xl p-1 outline-none"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex
              return (
                <li
                  key={option.value}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors select-none',
                    isActive ? 'bg-surface-3 text-ink' : 'text-ink-2',
                    isSelected && 'font-medium text-ink',
                  )}
                >
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <Check className="size-4 shrink-0 text-accent" strokeWidth={2.4} aria-hidden />}
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </div>
  )
}
