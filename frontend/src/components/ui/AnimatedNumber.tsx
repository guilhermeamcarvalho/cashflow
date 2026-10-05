import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  /** Duração da contagem em ms. */
  duration?: number
}

/**
 * Número que "conta" até o valor: do zero ao aparecer e do valor anterior ao
 * novo quando muda (ex.: ao trocar de mês). Sem animação com movimento reduzido.
 */
export function AnimatedNumber({ value, format, duration = 650 }: AnimatedNumberProps) {
  const [reduced] = useState(prefersReducedMotion)
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)

  useEffect(() => {
    const from = shownRef.current
    if (reduced || from === value) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      const next = progress === 1 ? value : from + (value - from) * eased
      shownRef.current = next
      setShown(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, reduced])

  return <>{format(reduced ? value : shown)}</>
}
