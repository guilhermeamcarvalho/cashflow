import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Painel modal: sobe da parte inferior no celular e aparece centralizado no
 * desktop. Fecha com Esc ou clique fora; trava a rolagem da página enquanto aberto.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      // um dropdown aberto dentro do painel trata o próprio Esc (defaultPrevented)
      if (event.key === 'Escape' && !event.defaultPrevented) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // foca o primeiro campo (ou o próprio painel)
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, select, textarea')
    ;(firstField ?? panelRef.current)?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="scrim animate-fade absolute inset-0" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="popover animate-sheet relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl outline-none sm:rounded-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="-mr-1.5 inline-flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
