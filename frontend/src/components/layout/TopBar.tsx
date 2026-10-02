import clsx from 'clsx'
import { ChevronDown, LogOut, Monitor, Moon, Repeat, Settings, Sun, Tags } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTheme, type ThemePreference } from '@/app/theme'
import { Avatar } from '@/components/ui/Avatar'
import { useDismissOnOutsideClick } from '@/components/ui/popover'
import { useAuth } from '@/features/auth/AuthContext'
import { Logo } from './Logo'

/** Barra superior: marca à esquerda e menu da conta à direita. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/" aria-label="Cashflow — início">
          <Logo />
        </Link>
        <UserMenu />
      </div>
    </header>
  )
}

const THEME_CYCLE: Record<ThemePreference, { next: ThemePreference; label: string; icon: ReactNode }> = {
  system: { next: 'light', label: 'Tema: sistema', icon: <Monitor className="size-4" /> },
  light: { next: 'dark', label: 'Tema: claro', icon: <Sun className="size-4" /> },
  dark: { next: 'system', label: 'Tema: escuro', icon: <Moon className="size-4" /> },
}

function UserMenu() {
  const { user, logout } = useAuth()
  const { preference, setPreference } = useTheme()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])
  useDismissOnOutsideClick(open, [menuRef, triggerRef], close)

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const theme = THEME_CYCLE[preference]
  const item =
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink focus-visible:bg-surface-3 focus-visible:outline-none'

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu da conta"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-surface-3"
      >
        <Avatar name={user?.name ?? ''} />
        <span className="hidden max-w-40 truncate text-sm font-medium text-ink sm:block">
          {user?.name.split(' ')[0]}
        </span>
        <ChevronDown
          className={clsx('size-4 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Conta"
          className="popover animate-pop absolute top-full right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl p-1.5"
        >
          <div className="mb-1 border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-3">{user?.email}</p>
          </div>
          <Link to="/recurring" role="menuitem" onClick={close} className={item}>
            <Repeat className="size-4" aria-hidden /> Lançamentos fixos
          </Link>
          <Link to="/settings" role="menuitem" onClick={close} className={item}>
            <Settings className="size-4" aria-hidden /> Ajustes
          </Link>
          <Link to="/settings/categories" role="menuitem" onClick={close} className={item}>
            <Tags className="size-4" aria-hidden /> Categorias
          </Link>
          <button type="button" role="menuitem" onClick={() => setPreference(theme.next)} className={item}>
            {theme.icon} {theme.label}
          </button>
          <div className="my-1 border-t border-line" />
          <button type="button" role="menuitem" onClick={logout} className={clsx(item, 'text-critical hover:text-critical')}>
            <LogOut className="size-4" aria-hidden /> Sair da conta
          </button>
        </div>
      )}
    </div>
  )
}
