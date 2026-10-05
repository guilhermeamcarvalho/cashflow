import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'cashflow.theme'

interface ThemeContextValue {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function apply(preference: ThemePreference) {
  const dark =
    preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Tema claro/escuro/sistema, aplicado via atributo data-theme no <html>. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    apply(preference)
    if (preference !== 'system') return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    // Crossfade entre os temas (View Transitions), quando o navegador suporta.
    const root = document.documentElement
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.dataset.themeSwitching = ''
      const transition = document.startViewTransition(() => {
        flushSync(() => setPreferenceState(next))
        apply(next)
      })
      void transition.finished.finally(() => delete root.dataset.themeSwitching)
    } else {
      setPreferenceState(next)
    }
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // preferência vale apenas nesta sessão
    }
  }, [])

  return <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return context
}
