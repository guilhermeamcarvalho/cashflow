import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Settings,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  match: (path: string) => boolean
}

export const DASHBOARD: NavItem = {
  to: '/',
  label: 'Início',
  icon: LayoutDashboard,
  match: (p) => p === '/',
}
export const TRANSACTIONS: NavItem = {
  to: '/transactions',
  label: 'Lançamentos',
  icon: ArrowLeftRight,
  match: (p) => p.startsWith('/transactions'),
}
export const CARDS: NavItem = {
  to: '/cards',
  label: 'Cartões',
  icon: CreditCard,
  match: (p) => p.startsWith('/cards'),
}
export const BUDGETS: NavItem = {
  to: '/budgets',
  label: 'Orçamentos',
  icon: PiggyBank,
  match: (p) => p.startsWith('/budgets'),
}
export const RECURRING: NavItem = {
  to: '/recurring',
  label: 'Lançamentos fixos',
  icon: Repeat,
  match: (p) => p.startsWith('/recurring'),
}
export const CATEGORIES: NavItem = {
  to: '/settings/categories',
  label: 'Categorias',
  icon: Tags,
  match: (p) => p.startsWith('/settings/categories'),
}
export const SETTINGS: NavItem = {
  to: '/settings',
  label: 'Ajustes',
  icon: Settings,
  match: (p) => p === '/settings',
}

/** Navegação da barra lateral, na ordem dos atalhos Ctrl+1…Ctrl+6. */
export const SIDEBAR_MAIN: NavItem[] = [DASHBOARD, TRANSACTIONS, CARDS, BUDGETS, RECURRING, CATEGORIES]
