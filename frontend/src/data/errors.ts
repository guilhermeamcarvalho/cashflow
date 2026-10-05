/**
 * Erro de regra de negócio da camada de dados local. Os códigos seguem a
 * semântica HTTP que a API usava (404, 409, 422) para as telas continuarem
 * tratando cada caso igual.
 */
export class AppError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(message: string, status = 422, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const notFound = (resource: string) => new AppError(`${resource} não encontrado(a)`, 404)

export const conflict = (message: string, field?: string) =>
  new AppError(message, 409, field ? { [field]: message } : {})

export const businessRule = (message: string) => new AppError(message, 422)

/** Erro de validação, com a mensagem de cada campo do formulário. */
export function invalid(fieldErrors: Record<string, string>): AppError {
  return new AppError(Object.values(fieldErrors)[0] ?? 'Dados inválidos', 400, fieldErrors)
}
