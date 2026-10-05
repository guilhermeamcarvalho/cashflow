import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router'
import { useTheme } from '@/app/theme'
import { Avatar } from '@/components/ui/Avatar'
import { useProfile } from '@/features/profile/ProfileContext'
import { useTransactionSheet } from '@/features/transactions/TransactionSheetContext'
import { Logo } from './Logo'
import { SETTINGS, SIDEBAR_MAIN, type NavItem } from './navigation'
import { THEME_CYCLE } from './TopBar'

/**
 * Barra lateral do layout de aplicativo. Em janelas estreitas (< lg) fica só
 * com ícones; os rótulos aparecem como dica ao passar o mouse.
 */
export function Sidebar({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const { openCreate } = useTransactionSheet()
  const { profile } = useProfile()
  const { preference, setPreference } = useTheme()
  const theme = THEME_CYCLE[preference]

  return (
    <aside
      aria-label="Navegação principal"
      className={clsx(
        'h-full w-[4.25rem] shrink-0 flex-col border-r border-line bg-surface lg:w-60',
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-center px-4 lg:justify-start lg:px-5">
        <Link to="/" aria-label="Cashflow — início">
          <Logo collapsible />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={openCreate}
          title="Novo lançamento (Ctrl+N)"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium whitespace-nowrap text-on-primary shadow-xs transition-colors hover:bg-primary-hover lg:justify-start lg:px-3"
        >
          <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <span className="hidden flex-1 text-left lg:inline">Novo lançamento</span>
          <kbd className="hidden rounded border border-white/20 px-1.5 font-sans text-[0.6875rem] opacity-70 lg:inline">
            Ctrl N
          </kbd>
        </button>
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
        {SIDEBAR_MAIN.map((item, index) => (
          <SidebarLink key={item.to} item={item} active={item.match(pathname)} shortcut={`Ctrl+${index + 1}`} />
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-line px-3 py-3">
        <button
          type="button"
          onClick={() => setPreference(theme.next)}
          title={`${theme.label} (clique para trocar)`}
          className={itemClass(false)}
        >
          <span className="flex size-5 shrink-0 items-center justify-center">{theme.icon}</span>
          <span className="hidden truncate lg:inline">{theme.label}</span>
        </button>
        <SidebarLink item={SETTINGS} active={SETTINGS.match(pathname)} shortcut="Ctrl+," />
        <Link
          to="/settings"
          title={profile?.name || 'Perfil'}
          className="mt-1 flex items-center justify-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-surface-3 lg:justify-start"
        >
          <Avatar name={profile?.name ?? ''} />
          <span className="hidden min-w-0 truncate text-sm font-medium text-ink lg:block">
            {profile?.name || 'Sem nome'}
          </span>
        </Link>
      </div>
    </aside>
  )
}

const itemClass = (active: boolean) =>
  clsx(
    'flex h-9 w-full items-center justify-center gap-3 rounded-lg px-2 text-sm transition-colors lg:justify-start lg:px-2.5',
    active ? 'bg-surface-3 font-medium text-ink' : 'text-ink-2 hover:bg-surface-3/70 hover:text-ink',
  )

function SidebarLink({ item, active, shortcut }: { item: NavItem; active: boolean; shortcut: string }) {
  return (
    <NavLink to={item.to} end={item.to === '/'} title={`${item.label} (${shortcut})`} className={itemClass(active)}>
      <item.icon className={clsx('size-[1.125rem] shrink-0', active && 'text-accent')} strokeWidth={2} aria-hidden />
      <span className="hidden truncate lg:inline">{item.label}</span>
    </NavLink>
  )
}
