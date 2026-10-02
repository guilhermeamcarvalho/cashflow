import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const GAP = 6
const VIEWPORT_MARGIN = 12

interface AnchoredOptions {
  /** Altura máxima desejada do popover. */
  maxHeight: number
  /** Largura mínima (por padrão, a largura do gatilho). */
  minWidth?: number
  /** Largura fixa (ex.: calendário); tem prioridade sobre minWidth. */
  width?: number
}

/**
 * Calcula a posição fixa de um popover ancorado a um elemento: abre para baixo
 * ou, se faltar espaço, para cima; nunca sai da viewport na horizontal; e
 * acompanha rolagem/redimensionamento enquanto estiver aberto.
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  { maxHeight, minWidth = 0, width }: AnchoredOptions,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({})

  const update = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const finalWidth = Math.min(width ?? Math.max(rect.width, minWidth), viewportWidth - VIEWPORT_MARGIN * 2)
    const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), viewportWidth - finalWidth - VIEWPORT_MARGIN)

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN
    const spaceAbove = rect.top - VIEWPORT_MARGIN
    const openUp = spaceBelow < maxHeight + GAP && spaceAbove > spaceBelow

    setStyle({
      left,
      width: finalWidth,
      maxHeight: Math.min(maxHeight, (openUp ? spaceAbove : spaceBelow) - GAP),
      ...(openUp ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      transformOrigin: openUp ? 'bottom' : 'top',
    })
  }, [anchorRef, maxHeight, minWidth, width])

  useLayoutEffect(() => {
    if (!open) return
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, update])

  return style
}

/** Fecha o popover ao clicar/tocar fora dos elementos informados. */
export function useDismissOnOutsideClick(
  open: boolean,
  refs: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!refs.some((ref) => ref.current?.contains(target))) onDismiss()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
    // refs são estáveis (useRef); onDismiss pode mudar a cada render
  }, [open, onDismiss]) // eslint-disable-line react-hooks/exhaustive-deps
}
