import clsx from 'clsx'
import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Spinner } from '@/components/ui/Feedback'
import { isDesktop } from '@/data/desktop'
import { TransactionSheetProvider, useTransactionSheet } from '@/features/transactions/TransactionSheetContext'
import { BottomNav } from './BottomNav'
import { SETTINGS, SIDEBAR_MAIN } from './navigation'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * Moldura das telas. Layout de aplicativo (barra lateral fixa e só o conteúdo
 * rolando) no app desktop e em telas largas; no celular, barra superior e
 * navegação flutuante na parte inferior.
 */
export function AppLayout() {
  return (
    <TransactionSheetProvider>
      <Shell />
    </TransactionSheetProvider>
  )
}

function Shell() {
  const contentRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useAppShortcuts()

  // A rolagem é do painel de conteúdo, não da página: volta ao topo ao trocar de tela.
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className={clsx('flex', isDesktop ? 'h-dvh' : 'lg:h-dvh')}>
      <Sidebar className={isDesktop ? 'flex' : 'hidden lg:flex'} />
      <div ref={contentRef} className={clsx('min-w-0 flex-1', isDesktop ? 'overflow-y-auto' : 'lg:overflow-y-auto')}>
        {!isDesktop && <TopBar className="lg:hidden" />}
        <main
          className={clsx(
            'mx-auto w-full max-w-6xl pt-6 lg:px-10 lg:pt-8',
            isDesktop ? 'px-6 pb-10' : 'px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] sm:px-6 lg:pb-12',
          )}
        >
          {/* key: cada tela nova entra com a animação de página */}
          <div key={pathname} className="animate-page">
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      {!isDesktop && <BottomNav className="lg:hidden" />}
    </div>
  )
}

/** Atalhos de aplicativo: Ctrl+N novo lançamento, Ctrl+1…6 telas, Ctrl+, ajustes. */
function useAppShortcuts() {
  const navigate = useNavigate()
  const { openCreate } = useTransactionSheet()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
      const key = event.key.toLowerCase()
      const target =
        key === ',' ? SETTINGS.to : /^[1-9]$/.test(key) ? SIDEBAR_MAIN[Number(key) - 1]?.to : undefined
      if (key === 'n') {
        event.preventDefault()
        openCreate()
      } else if (target) {
        event.preventDefault()
        navigate(target, { viewTransition: true })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate, openCreate])
}
