import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Transaction } from '@/types/api'
import { TransactionForm } from './TransactionForm'
import { Sheet } from '@/components/ui/Sheet'

interface TransactionSheetApi {
  openCreate: () => void
  openEdit: (transaction: Transaction) => void
}

const TransactionSheetContext = createContext<TransactionSheetApi | null>(null)

type SheetState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; transaction: Transaction }

/**
 * Formulário de lançamento único e global: pode ser aberto pela barra inferior,
 * pelo dashboard ou pela lista, sem duplicar estado entre telas.
 */
export function TransactionSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({ mode: 'closed' })
  const close = useCallback(() => setState({ mode: 'closed' }), [])

  const api = useMemo<TransactionSheetApi>(
    () => ({
      openCreate: () => setState({ mode: 'create' }),
      openEdit: (transaction) => setState({ mode: 'edit', transaction }),
    }),
    [],
  )

  const editing = state.mode === 'edit' ? state.transaction : undefined

  return (
    <TransactionSheetContext.Provider value={api}>
      {children}
      <Sheet open={state.mode !== 'closed'} onClose={close} title={editing ? 'Editar lançamento' : 'Novo lançamento'}>
        {state.mode !== 'closed' && <TransactionForm key={editing?.id ?? 'new'} transaction={editing} onDone={close} />}
      </Sheet>
    </TransactionSheetContext.Provider>
  )
}

export function useTransactionSheet(): TransactionSheetApi {
  const context = useContext(TransactionSheetContext)
  if (!context) throw new Error('useTransactionSheet deve ser usado dentro de <TransactionSheetProvider>')
  return context
}
