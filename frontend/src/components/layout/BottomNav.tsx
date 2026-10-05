import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { useTransactionSheet } from '@/features/transactions/TransactionSheetContext'
import { BUDGETS, CARDS, DASHBOARD, TRANSACTIONS, type NavItem } from './navigation'

/** Slots da barra; o índice 2 é o botão central de adicionar. */
const ITEMS: (NavItem | 'add')[] = [DASHBOARD, TRANSACTIONS, 'add', CARDS, BUDGETS]

/**
 * Barra de navegação flutuante na parte inferior (layout web/celular). No
 * celular, ícone + rótulo empilhados; em telas médias, lado a lado.
 */
export function BottomNav({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const { openCreate } = useTransactionSheet()

  return (
    <nav
      aria-label="Navegação principal"
      className={clsx(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-[calc(env(safe-area-inset-bottom)+1.25rem)]',
        className,
      )}
    >
      <div className="dock pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-[1.375rem] p-1.5 sm:w-auto sm:max-w-none">
        {ITEMS.map((item) =>
          item === 'add' ? (
            <button
              key="add"
              type="button"
              onClick={openCreate}
              aria-label="Novo lançamento"
              title="Novo lançamento"
              className="mx-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-accent to-[color-mix(in_srgb,var(--accent)_70%,#000)] text-white shadow-[0_6px_16px_-4px_var(--accent-ring),inset_0_1px_0_rgb(255_255_255/0.25)] transition-transform hover:scale-105 active:scale-95 sm:mx-1.5"
            >
              <Plus className="size-5" strokeWidth={2.5} aria-hidden />
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={clsx(
                'flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition-colors sm:flex-none sm:flex-row sm:gap-2 sm:px-4',
                item.match(pathname)
                  ? 'bg-surface-3 text-ink'
                  : 'text-ink-3 hover:bg-surface-3/60 hover:text-ink-2',
              )}
            >
              <item.icon
                className={clsx('size-5 shrink-0 sm:size-[1.125rem]', item.match(pathname) && 'text-accent')}
                strokeWidth={2}
                aria-hidden
              />
              <span className="text-[0.6875rem] font-medium whitespace-nowrap sm:text-sm">{item.label}</span>
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}
