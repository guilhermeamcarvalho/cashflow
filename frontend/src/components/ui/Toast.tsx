import clsx from 'clsx'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { isDesktop } from '@/data/desktop'

type ToastTone = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

let nextId = 1

/** Notificações curtas e não bloqueantes (topo da tela; no desktop, canto superior direito). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, tone: ToastTone) => {
    const id = nextId++
    setItems((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className={clsx(
            'pointer-events-none fixed z-[60] flex gap-2',
            // Layout de app (barra lateral): canto inferior direito, como nos apps de desktop.
            // Celular: no topo, longe da navegação inferior.
            isDesktop
              ? 'right-6 bottom-6 flex-col-reverse items-end'
              : 'inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] flex-col items-center px-4 sm:inset-x-auto sm:top-[calc(env(safe-area-inset-top)+4.5rem)] sm:right-6 sm:items-end lg:top-auto lg:bottom-6 lg:flex-col-reverse',
          )}
        >
          {items.map((item) => (
            <div
              key={item.id}
              role="status"
              className="popover animate-toast flex max-w-sm items-center gap-2.5 rounded-xl py-2.5 pr-4 pl-3 text-sm font-medium text-ink"
            >
              {item.tone === 'success' ? (
                <CircleCheck className="size-4 shrink-0 text-good" aria-hidden />
              ) : (
                <CircleAlert className="size-4 shrink-0 text-critical" aria-hidden />
              )}
              <span>{item.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return context
}
