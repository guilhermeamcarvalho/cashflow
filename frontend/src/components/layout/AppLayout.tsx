import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Spinner } from '@/components/ui/Feedback'
import { TransactionSheetProvider } from '@/features/transactions/TransactionSheetContext'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

/** Moldura das telas autenticadas: barra superior, conteúdo e navegação flutuante. */
export function AppLayout() {
  return (
    <TransactionSheetProvider>
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] sm:px-6 lg:px-10 lg:pt-10">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </TransactionSheetProvider>
  )
}
