import clsx from 'clsx'

/** Iniciais do usuário num círculo neutro. */
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  return (
    <span
      aria-hidden
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#0f2a7a] font-semibold text-white',
        size === 'sm' ? 'size-8 text-xs' : 'size-12 text-base',
      )}
    >
      {initials}
    </span>
  )
}
