import { useEffect, useState } from 'react'

/**
 * Lê o valor computado de uma variável CSS e o atualiza quando o tema muda.
 * Necessário para bibliotecas (como o Recharts) que escrevem cores em
 * atributos SVG, onde `var(--x)` não é resolvido.
 */
export function useCssVar(name: string, fallback: string): string {
  const read = () =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

  const [value, setValue] = useState(read)

  useEffect(() => {
    const observer = new MutationObserver(() => setValue(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  return value
}
