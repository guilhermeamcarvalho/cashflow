import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { FirstAccessOnly, RequireProfile } from '@/features/profile/RequireProfile'

// Cada tela vira um chunk separado (carregado sob demanda).
const WelcomePage = lazy(() => import('@/features/profile/WelcomePage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage'))
const BudgetsPage = lazy(() => import('@/features/budgets/BudgetsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const CategoriesPage = lazy(() => import('@/features/categories/CategoriesPage'))
const RecurringPage = lazy(() => import('@/features/recurring/RecurringPage'))
const CreditCardsPage = lazy(() => import('@/features/creditcards/CreditCardsPage'))

export const router = createBrowserRouter([
  {
    element: <FirstAccessOnly />,
    children: [{ path: '/welcome', element: <WelcomePage /> }],
  },
  {
    element: <RequireProfile />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'budgets', element: <BudgetsPage /> },
          { path: 'recurring', element: <RecurringPage /> },
          { path: 'cards', element: <CreditCardsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/categories', element: <CategoriesPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
