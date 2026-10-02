import clsx from 'clsx'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/** Controle segmentado: trilho neutro com um indicador que desliza até a opção ativa. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx('relative flex rounded-xl border border-line bg-surface-3 p-0.5', className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 rounded-[0.625rem] border border-line bg-surface shadow-xs transition-transform duration-200 ease-fluid"
        style={{
          width: `calc((100% - 0.25rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'relative z-10 h-8 flex-1 rounded-[0.625rem] px-2 text-[0.8125rem] font-medium transition-colors',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
