import { timestamp } from './clock'
import { AppError } from './errors'
import { emptyDatabase, SCHEMA_VERSION, type Database } from './schema'
import { read, replaceAll } from './store'

/**
 * Backup em JSON: os dados vivem só neste navegador, então exportar é a forma
 * de levá-los para outro aparelho ou se proteger de uma limpeza do navegador.
 */
const FORMAT = 'cashflow-backup'

interface BackupFile {
  format: typeof FORMAT
  version: number
  exportedAt: string
  data: Database
}

export function exportBackup(): Promise<string> {
  return read((db) => {
    const backup: BackupFile = { format: FORMAT, version: SCHEMA_VERSION, exportedAt: timestamp(), data: db }
    return JSON.stringify(backup, null, 2)
  })
}

const LIST_KEYS = ['categories', 'transactions', 'budgets', 'creditCards', 'invoicePayments', 'recurring'] as const

/** Lê um arquivo de backup e substitui TODOS os dados atuais por ele. */
export async function importBackup(text: string): Promise<void> {
  let parsed: Partial<BackupFile>
  try {
    parsed = JSON.parse(text) as Partial<BackupFile>
  } catch {
    throw new AppError('O arquivo não é um backup válido do Cashflow')
  }
  const data = parsed?.data
  if (parsed?.format !== FORMAT || !data || LIST_KEYS.some((key) => !Array.isArray(data[key]))) {
    throw new AppError('O arquivo não é um backup válido do Cashflow')
  }
  if ((parsed.version ?? 0) > SCHEMA_VERSION) {
    throw new AppError('Este backup foi feito por uma versão mais nova do Cashflow')
  }
  // Um backup sem perfil ainda leva ao app (não volta para a tela de boas-vindas).
  await replaceAll({ ...data, profile: data.profile ?? { name: '', createdAt: timestamp() } })
}

/** Apaga tudo e volta à tela de boas-vindas. */
export function clearAllData(): Promise<void> {
  return replaceAll(emptyDatabase())
}
