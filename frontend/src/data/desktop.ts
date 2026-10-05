import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { AppError } from './errors'
import type { Database } from './schema'
import { read, reload, type StorageAdapter } from './store'

/**
 * Versão desktop (Tauri): os dados ficam num arquivo `.json` no disco em vez
 * do IndexedDB. A pasta é configurável — numa pasta do OneDrive, o arquivo
 * ganha backup automático e é sincronizado entre computadores.
 */
export const isDesktop = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Onde os dados ficam, para os textos das telas. */
export const STORAGE_PLACE = isDesktop ? 'neste computador' : 'neste navegador'

const DATA_FILE = 'cashflow-dados.json'
const CONFIG_FILE = 'config.json'

interface DesktopConfig {
  /** Pasta escolhida pelo usuário; ausente = pasta padrão do app. */
  dataDir?: string
}

const readText = (path: string) => invoke<string | null>('read_text_file', { path })
const writeText = (path: string, contents: string) => invoke<void>('write_text_file', { path, contents })
const defaultDir = () => invoke<string>('default_data_dir')

async function configPath(): Promise<string> {
  return join(await defaultDir(), CONFIG_FILE)
}

async function readConfig(): Promise<DesktopConfig> {
  const text = await readText(await configPath())
  try {
    return text ? (JSON.parse(text) as DesktopConfig) : {}
  } catch {
    return {}
  }
}

/** Caminho completo do arquivo de dados em uso. */
export async function dataFilePath(): Promise<string> {
  const { dataDir } = await readConfig()
  return join(dataDir ?? (await defaultDir()), DATA_FILE)
}

function parse(text: string, path: string): Database {
  try {
    return JSON.parse(text) as Database
  } catch {
    // Nunca devolve null aqui: o app trataria como "sem dados" e sobrescreveria o arquivo.
    throw new AppError(`O arquivo de dados está corrompido: ${path}`)
  }
}

export const fileAdapter: StorageAdapter = {
  load: async () => {
    const path = await dataFilePath()
    const text = await readText(path)
    return text ? parse(text, path) : null
  },
  save: async (db) => writeText(await dataFilePath(), JSON.stringify(db)),
}

/**
 * Passa a usar a pasta `dir`. Se ela já tem um arquivo de dados (ex.: criado
 * em outro computador pelo OneDrive), abre esse arquivo; senão, copia os dados
 * atuais para lá. O arquivo antigo fica intacto nos dois casos.
 */
export async function changeDataFolder(dir: string): Promise<'opened' | 'copied'> {
  const target = await join(dir, DATA_FILE)
  const existing = await readText(target)
  if (existing) parse(existing, target)
  else await writeText(target, await read((db) => JSON.stringify(db)))

  await writeText(await configPath(), JSON.stringify({ dataDir: dir } satisfies DesktopConfig))
  await reload()
  return existing ? 'opened' : 'copied'
}

/** Ao voltar para a janela, relê o arquivo (pode ter sido sincronizado por outro computador). */
export function reloadOnFocus(): void {
  window.addEventListener('focus', () => void reload())
}
