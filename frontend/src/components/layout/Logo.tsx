import clsx from 'clsx'

interface LogoProps {
  className?: string
  inverted?: boolean
  /** Esconde o nome em telas estreitas (barra lateral recolhida). */
  collapsible?: boolean
}

/** Marca do produto: símbolo + nome. */
export function Logo({ className, inverted = false, collapsible = false }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 64 64" className="size-7 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="14" className={inverted ? 'fill-white' : 'fill-primary'} />
        <g
          fill="none"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={inverted ? 'stroke-[#101828]' : 'stroke-on-primary'}
        >
          <path d="M17 41l9.5-9.5 7 7L47 25" />
          <path d="M38 25h9v9" />
        </g>
      </svg>
      <span
        className={clsx(
          'text-[1.05rem] font-semibold tracking-tight',
          inverted ? 'text-white' : 'text-ink',
          collapsible && 'hidden lg:inline',
        )}
      >
        Cashflow
      </span>
    </span>
  )
}
