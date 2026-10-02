import { ArrowLeftRight, CreditCard, LayoutDashboard, PiggyBank, type LucideIcon } from 'lucide-react'

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
