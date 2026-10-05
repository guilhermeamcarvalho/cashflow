import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { Spinner } from '@/components/ui/Feedback'
import { fileAdapter, isDesktop, reloadOnFocus } from '@/data/desktop'
import { setStorageAdapter } from '@/data/store'
import '@/styles/index.css'

// No app desktop (Tauri) os dados ficam num arquivo; no navegador, no IndexedDB.
if (isDesktop) {
  setStorageAdapter(fileAdapter)
  reloadOnFocus()
  // Comportamento de aplicativo (ver "App desktop" em styles/index.css).
  document.documentElement.dataset.app = ''
  // Sem o menu de contexto do navegador ("Recarregar", "Inspecionar"…), exceto em campos de texto.
  document.addEventListener('contextmenu', (event) => {
    if (!(event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]')) event.preventDefault()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <Suspense fallback={<Spinner className="min-h-dvh items-center" />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  </StrictMode>,
)
