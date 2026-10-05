import { invalid } from './errors'
import { toCents } from './money'

/**
 * Validação de entrada dos serviços (as telas também validam, por conveniência). Acumula
 * os erros por campo e lança tudo de uma vez em {@link Validator.check}.
 */
export class Validator {
  private readonly errors: Record<string, string> = {}

  private fail(field: string, message: string): void {
    this.errors[field] ??= message
  }

  text(field: string, value: string | null | undefined, max: number, required: string, tooLong: string): string {
    const trimmed = (value ?? '').trim()
    if (!trimmed) this.fail(field, required)
    else if (trimmed.length > max) this.fail(field, tooLong)
    return trimmed
  }

  optionalText(field: string, value: string | null | undefined, max: number, tooLong: string): string | null {
    const trimmed = (value ?? '').trim()
    if (trimmed.length > max) this.fail(field, tooLong)
    return trimmed || null
  }

  /** Valor em reais maior que zero; devolve centavos. */
  money(field: string, value: number | null | undefined, message = 'O valor deve ser maior que zero'): number {
    const cents = typeof value === 'number' && Number.isFinite(value) ? toCents(value) : 0
    if (cents <= 0) this.fail(field, message)
    else if (cents >= 1e14) this.fail(field, 'Valor inválido')
    return cents
  }

  integer(field: string, value: number | null | undefined, min: number, max: number, message: string): number {
    const n = Number(value)
    if (!Number.isInteger(n) || n < min || n > max) this.fail(field, message)
    return n
  }

  date(field: string, value: string | null | undefined, message = 'Informe a data'): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) this.fail(field, message)
    return value ?? ''
  }

  month(field: string, value: string | null | undefined, message = 'Informe o mês'): string {
    if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) this.fail(field, message)
    return value ?? ''
  }

  color(field: string, value: string | null | undefined): string {
    if (!value || !/^#[0-9A-Fa-f]{6}$/.test(value)) this.fail(field, 'Cor deve estar no formato #RRGGBB')
    return (value ?? '').toUpperCase()
  }

  required<T>(field: string, value: T | null | undefined, message: string): T {
    if (value == null || value === '') this.fail(field, message)
    return value as T
  }

  check(): void {
    if (Object.keys(this.errors).length > 0) throw invalid(this.errors)
  }
}
