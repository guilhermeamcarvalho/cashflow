import clsx from 'clsx'
import { useId, type ReactNode } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: ReactNode
  className?: string
}

/** Interruptor liga/desliga com rótulo e descrição (padrão ARIA "switch"). */
export function Switch({ checked, onChange, label, description, className }: SwitchProps) {
  const id = useId()
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[0.8125rem] text-ink-3">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          aria-hidden
          className={clsx(
            'inline-block size-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-fluid',
            checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
