import clsx from 'clsx'
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  error?: string
  hint?: string
  id: string
  children: ReactNode
}

function FieldShell({ label, error, hint, id, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[0.8125rem] text-critical">
          {error}
        </p>
      ) : (
        hint && <p className="text-[0.8125rem] text-ink-3">{hint}</p>
      )}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, className, id, ...props }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={clsx('field', className)}
        {...props}
      />
    </FieldShell>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} error={error} id={fieldId}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={clsx('field min-h-20 resize-none', className)}
        {...props}
      />
    </FieldShell>
  )
}

interface MoneyInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
  autoFocus?: boolean
}

/** Campo de valor em destaque (R$), aceitando vírgula ou ponto como decimal. */
export function MoneyInput({ value, onChange, error, label = 'Valor', autoFocus }: MoneyInputProps) {
  const id = useId()
  return (
    <FieldShell label={label} error={error} id={id}>
      <div className="field flex items-baseline gap-2 py-2.5" aria-invalid={error ? true : undefined}>
        <span className="text-base font-medium text-ink-3">R$</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          className="num w-full bg-transparent text-2xl font-semibold tracking-tight text-ink outline-none placeholder:text-ink-3/50"
        />
      </div>
    </FieldShell>
  )
}

/** Converte o texto digitado ("1.234,56" ou "1234.56") em número. */
export function parseMoney(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return Number.NaN
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed
  return Number(normalized)
}

/** Formata um número para edição no MoneyInput ("1234,5"). */
export function toMoneyInput(value: number): string {
  return value.toFixed(2).replace('.', ',')
}
