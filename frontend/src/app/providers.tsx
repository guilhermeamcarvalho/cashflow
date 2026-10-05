import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { ProfileProvider } from '@/features/profile/ProfileContext'
import { MonthProvider } from './month'
import { ThemeProvider } from './theme'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // As consultas são locais e baratas; reler ao voltar para a aba mantém
        // em dia o que depende de "hoje" (status das faturas, lançamentos fixos).
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Erros locais são de regra de negócio: tentar de novo não muda o resultado.
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/** Composição de todos os providers globais da aplicação. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ProfileProvider>
            <MonthProvider>{children}</MonthProvider>
          </ProfileProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
