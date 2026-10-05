/** Conversão entre reais (como as telas usam) e centavos (como o banco local guarda). */
export const toCents = (value: number): number => Math.round(value * 100)

export const fromCents = (cents: number): number => cents / 100

/** Percentual inteiro arredondado (meio para cima), 0 quando o todo é zero. */
export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part * 100) / whole)
}
